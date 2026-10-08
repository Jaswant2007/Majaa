import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status && status !== "ALL") where.verificationStatus = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            registrationNo: true,
            tier: true,
            status: true,
            trustScore: true,
          },
        },
        parentDoc: {
          select: {
            id: true,
            version: true,
            filename: true,
            sha256Hash: true,
            createdAt: true,
          },
        },
        subsequentVersions: {
          select: {
            id: true,
            version: true,
            filename: true,
            sha256Hash: true,
            createdAt: true,
          },
        },
        shipments: {
          include: {
            calculations: true,
          },
        },
        alerts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch audit history for each document
    const docIds = documents.map((d) => d.id);
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        entityType: "DOCUMENT",
        entityId: { in: docIds },
      },
      orderBy: { timestamp: "asc" },
    });

    const auditByDoc: Record<string, any[]> = {};
    for (const evt of auditEvents) {
      if (!auditByDoc[evt.entityId]) {
        auditByDoc[evt.entityId] = [];
      }
      auditByDoc[evt.entityId].push(evt);
    }

    const enrichedDocuments = documents.map((doc) => {
      let parsedExtraction = null;
      if (doc.extractedJson) {
        try {
          parsedExtraction = JSON.parse(doc.extractedJson);
        } catch {
          parsedExtraction = null;
        }
      }

      return {
        id: doc.id,
        supplierId: doc.supplierId,
        supplier: doc.supplier,
        filename: doc.filename,
        mimeType: doc.mimeType,
        size: doc.size,
        storagePath: doc.storagePath,
        sha256Hash: doc.sha256Hash,
        version: doc.version,
        parentDocId: doc.parentDocId,
        parentDoc: doc.parentDoc,
        subsequentVersions: doc.subsequentVersions,
        processingStatus: doc.processingStatus,
        verificationStatus: doc.verificationStatus,
        extractionConfidence: doc.extractionConfidence,
        extractedJson: parsedExtraction,
        validationNotes: doc.validationNotes,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
        reviewDecisionReason: doc.reviewDecisionReason,
        createdAt: doc.createdAt.toISOString(),
        shipments: doc.shipments,
        alerts: doc.alerts,
        validationHistory: auditByDoc[doc.id] || [],
      };
    });

    return NextResponse.json({
      documents: enrichedDocuments,
      totalCount: enrichedDocuments.length,
    });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch documents." },
      { status: 500 }
    );
  }
}
