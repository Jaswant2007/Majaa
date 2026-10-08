import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-ledger";
import { realtimeBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. RBAC check: Compliance Officer or Enterprise Admin
    const authResult = await requireRole(req, [
      "COMPLIANCE_OFFICER",
      "ENTERPRISE_ADMIN",
    ]);

    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { user } = authResult;
    const documentId = params.id;

    // 2. Parse payload
    const body = await req.json();
    const { decision, reason } = body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision. Must be 'APPROVED' or 'REJECTED'." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A detailed justification reason (minimum 5 characters) is required for compliance auditability." },
        { status: 400 }
      );
    }

    // 3. Locate Document
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        supplier: true,
        shipments: true,
        alerts: true,
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: `Document with ID ${documentId} not found.` },
        { status: 404 }
      );
    }

    const previousStatus = doc.verificationStatus;
    const newStatus = decision === "APPROVED" ? "VERIFIED" : "REJECTED";

    // 4. Update Document & Related Entities
    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: newStatus,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewDecisionReason: reason.trim(),
        validationNotes: `Manual review by ${user.role} (${user.email}): ${decision} - ${reason.trim()}`,
      },
    });

    // If approved, resolve alerts and update shipment status
    if (decision === "APPROVED") {
      await prisma.alert.updateMany({
        where: { documentId: documentId, status: "OPEN" },
        data: { status: "RESOLVED" },
      });

      await prisma.shipment.updateMany({
        where: { documentId: documentId },
        data: { status: "VERIFIED" },
      });

      // Update supplier status if it was stuck in REQUIRES_REVIEW
      if (doc.supplier.status === "REQUIRES_REVIEW") {
        const newTrustScore = Math.min(100, Math.round(doc.supplier.trustScore + 15));
        await prisma.supplier.update({
          where: { id: doc.supplierId },
          data: {
            status: "VERIFIED",
            trustScore: newTrustScore,
            lastVerifiedAt: new Date(),
          },
        });

        // Audit risk change
        await recordAuditEvent({
          actor: user.email,
          action: "RISK_CHANGE",
          entityType: "SUPPLIER",
          entityId: doc.supplierId,
          previousValue: `${doc.supplier.trustScore}`,
          newValue: `${newTrustScore}`,
          source: "COMPLIANCE_DESK",
          reason: `Trust score restored following Compliance Officer document adjudication approval.`,
        });
      }
    } else {
      // If rejected, ensure shipments are marked FLAGGED
      await prisma.shipment.updateMany({
        where: { documentId: documentId },
        data: { status: "FLAGGED" },
      });
    }

    // 5. Append Immutable Cryptographic Audit Event (Rule 8)
    const auditEvent = await recordAuditEvent({
      actor: user.email,
      action: "MANUAL_REVIEW",
      entityType: "DOCUMENT",
      entityId: doc.id,
      previousValue: JSON.stringify({ verificationStatus: previousStatus }),
      newValue: JSON.stringify({
        verificationStatus: newStatus,
        decision,
        reviewerRole: user.role,
        reviewerEmail: user.email,
      }),
      source: "COMPLIANCE_DESK",
      reason: `Compliance manual review [${decision}]: ${reason.trim()}`,
    });

    // 6. Broadcast Realtime WebSocket / SSE
    realtimeBus.broadcast("audit_committed", {
      documentId: doc.id,
      documentStatus: newStatus,
      supplierId: doc.supplierId,
      supplierName: doc.supplier.name,
      decision,
      reviewer: user.email,
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Document ${doc.filename} successfully marked as ${newStatus}.`,
      document: updatedDoc,
      auditEvent,
    });
  } catch (error: any) {
    console.error("Error in manual review handler:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process manual review." },
      { status: 500 }
    );
  }
}
