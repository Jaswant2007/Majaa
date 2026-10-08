import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-ledger";
import { realtimeBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireRole(req, [
      "ENTERPRISE_ADMIN",
      "COMPLIANCE_OFFICER",
      "SUSTAINABILITY_MANAGER",
    ]);

    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const { user } = authResult;
    const alertId = params.id;
    const body = await req.json();
    const { status, resolutionNotes } = body;

    const validStatuses = ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existingAlert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: { supplier: true },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: `Alert with ID ${alertId} not found.` },
        { status: 404 }
      );
    }

    const prevStatus = existingAlert.status;

    // Update alert
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status,
      },
    });

    // Record immutable audit event
    const auditEvent = await recordAuditEvent({
      actor: user.email,
      action: "STATUS_CHANGE",
      entityType: "ALERT",
      entityId: alertId,
      previousValue: JSON.stringify({ status: prevStatus }),
      newValue: JSON.stringify({ status, resolutionNotes: resolutionNotes || null }),
      source: "COMPLIANCE_DESK",
      reason: `Alert status transitioned from ${prevStatus} -> ${status} by ${user.role} (${user.email}). ${resolutionNotes ? `Notes: ${resolutionNotes}` : ""}`,
    });

    // Broadcast Realtime Event
    realtimeBus.broadcast("audit_committed", {
      alertId,
      supplierId: existingAlert.supplierId,
      status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      auditEvent,
    });
  } catch (error: any) {
    console.error("Alert status update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update alert." },
      { status: 500 }
    );
  }
}
