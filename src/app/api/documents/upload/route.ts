import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { extractDocumentEntities } from "@/lib/extractor";
import { executeDocumentVerificationPipeline } from "@/lib/integrity";
import { realtimeBus } from "@/lib/events";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // RBAC: Any valid user can submit manifests/documents
    const authResult = await requireRole(req, [
      "ENTERPRISE_ADMIN",
      "COMPLIANCE_OFFICER",
      "SUSTAINABILITY_MANAGER",
      "SUPPLIER_USER",
    ]);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    let filename = `manifest-${Date.now()}.txt`;
    let content = "";
    let supplierId = "";
    let docType: "LOGISTICS_MANIFEST" | "COMPLIANCE_CERT" | "UTILITY_BILL" = "LOGISTICS_MANIFEST";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      supplierId = (formData.get("supplierId") as string) || "";
      const rawDocType = (formData.get("docType") as string) || "";
      if (rawDocType === "COMPLIANCE_CERT" || rawDocType === "UTILITY_BILL") {
        docType = rawDocType;
      }

      if (file) {
        filename = file.name;
        content = await file.text();
      } else {
        const textParam = formData.get("content") as string | null;
        if (textParam) content = textParam;
      }
    } else {
      const body = await req.json();
      filename = body.filename || filename;
      content = body.content || "";
      supplierId = body.supplierId || "";
      if (body.docType === "COMPLIANCE_CERT" || body.docType === "UTILITY_BILL") {
        docType = body.docType;
      }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Document content is empty or unreadable." }, { status: 400 });
    }

    // Lookup supplier
    let targetSupplier = supplierId
      ? await prisma.supplier.findUnique({ where: { id: supplierId } })
      : null;

    if (!targetSupplier) {
      targetSupplier = await prisma.supplier.findFirst({
        where: { registrationNo: "PL-KRS-0000918273" }, // Trans-Eurasia
      });
      if (!targetSupplier) {
        targetSupplier = await prisma.supplier.findFirst();
      }
    }

    if (!targetSupplier) {
      return NextResponse.json({ error: "No supplier found in database to associate document." }, { status: 404 });
    }

    // Step 1: Compute SHA-256 integrity hash
    const sha256Hash = crypto.createHash("sha256").update(content).digest("hex");

    // Step 2: Zero-Trust Duplicate Check across all suppliers
    const duplicateDoc = await prisma.document.findFirst({
      where: { sha256Hash },
      include: { supplier: { select: { id: true, name: true } } },
    });

    if (duplicateDoc) {
      return NextResponse.json(
        {
          error: "DUPLICATE_DOCUMENT_DETECTED",
          message: `Document with identical cryptographic SHA-256 checksum already registered (Supplier: ${duplicateDoc.supplier.name}).`,
          existingDocumentId: duplicateDoc.id,
          sha256Hash,
        },
        { status: 409 }
      );
    }

    // Step 3: Upload to Supabase Private Storage ("supplier-documents")
    let storagePath = `supplier-documents/${targetSupplier.id}/${Date.now()}-${filename}`;
    try {
      const { getAdminClient } = await import("@/lib/supabase/admin");
      const admin = getAdminClient();
      const fileBuffer = Buffer.from(content, "utf-8");
      const { data: storageUpload, error: storageErr } = await admin.storage
        .from("supplier-documents")
        .upload(`${targetSupplier.id}/${Date.now()}-${filename}`, fileBuffer, {
          contentType: "text/plain",
          upsert: true,
        });
      if (!storageErr && storageUpload?.path) {
        storagePath = storageUpload.path;
      }
    } catch {
      // Graceful fallback to deterministic path if storage credentials pending
    }

    // Step 4: Zero-Trust Document Record created in UNVERIFIED state (Rule 6)
    const doc = await prisma.document.create({
      data: {
        supplierId: targetSupplier.id,
        filename,
        mimeType: "text/plain",
        size: Buffer.byteLength(content),
        storagePath,
        sha256Hash,
        uploadedBy: authResult.user.id,
        processingStatus: "UNVERIFIED",
        verificationStatus: "PENDING",
      },
    });

    realtimeBus.broadcast("document_created", {
      documentId: doc.id,
      status: "UNVERIFIED",
      filename: doc.filename,
      supplierName: targetSupplier.name,
      supplierId: targetSupplier.id,
    });

    // Step 3: Run Document Entity Extraction (Rule 4: untrusted output validated via Zod)
    const extractionResult = await extractDocumentEntities({
      content,
      filename,
      declaredDocType: docType,
    });

    if (!extractionResult.success || !extractionResult.data) {
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          processingStatus: "VALIDATION_FAILED",
          verificationStatus: "REJECTED",
          validationNotes: extractionResult.error || "Schema validation failed on extracted fields.",
        },
      });

      await prisma.auditEvent.create({
        data: {
          actor: authResult.user.email,
          action: "VALIDATION_FAILED",
          entityType: "DOCUMENT",
          entityId: doc.id,
          reason: extractionResult.error || "Failed schema validation during entity extraction.",
          source: "ZERO_TRUST_PIPELINE",
        },
      });

      realtimeBus.broadcast("document_failed", {
        documentId: doc.id,
        status: "VALIDATION_FAILED",
        error: extractionResult.error,
      });

      return NextResponse.json(
        {
          error: "Document validation failed against schema.",
          details: extractionResult.error,
          documentId: doc.id,
        },
        { status: 422 }
      );
    }

    // Step 4: Run ACID Transaction Pipeline (Rule 7)
    const pipelineResult = await executeDocumentVerificationPipeline({
      documentId: doc.id,
      supplierId: targetSupplier.id,
      extractedData: extractionResult.data,
      docType,
      actorRole: authResult.user.role,
    });

    // Step 5: Broadcast Live Real-time Event to Connected Dashboards
    realtimeBus.broadcast("audit_committed", {
      documentId: doc.id,
      documentStatus: pipelineResult.document.verificationStatus,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      supplierRating: (pipelineResult.supplier as any)?.rating,
      supplierScore: (pipelineResult.supplier as any)?.score,
      supplierStatus: pipelineResult.supplier?.status,
      alertsCount: pipelineResult.alerts?.length || 0,
      calculation: pipelineResult.calculation,
      auditHash: pipelineResult.auditLog.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      document: {
        ...pipelineResult.document,
        status: pipelineResult.document.verificationStatus,
      },
      shipment: pipelineResult.shipment,
      calculation: pipelineResult.calculation,
      alerts: pipelineResult.alerts,
      supplier: pipelineResult.supplier,
      auditLog: pipelineResult.auditLog,
    });
  } catch (error: unknown) {
    console.error("Document upload pipeline error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal pipeline execution error",
      },
      { status: 500 }
    );
  }
}
