import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuditLedgerChain } from "@/lib/audit-ledger";

export const dynamic = "force-dynamic";

/**
 * Audit Ledger API - Strictly Append-Only (No PUT, PATCH, or DELETE routes).
 * Returns chronological cryptographic event trace with filter capabilities.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const documentId = searchParams.get("documentId");
    const shipmentId = searchParams.get("shipmentId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "100", 10)));

    // Build filter clause
    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (entityType && entityType !== "ALL") {
      where.entityType = entityType;
    }

    // Specific entity target
    if (documentId) {
      where.entityType = "DOCUMENT";
      where.entityId = documentId;
    } else if (shipmentId) {
      where.entityType = "SHIPMENT";
      where.entityId = shipmentId;
    } else if (supplierId) {
      // Find all document IDs and shipment IDs for this supplier
      const docs = await prisma.document.findMany({
        where: { supplierId },
        select: { id: true },
      });
      const docIds = docs.map((d) => d.id);

      where.OR = [
        { entityType: "SUPPLIER", entityId: supplierId },
        { entityType: "DOCUMENT", entityId: { in: docIds } },
      ];
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { reason: { contains: search } },
        { actor: { contains: search } },
        { entityId: { contains: search } },
        { action: { contains: search } },
      ];
    }

    // Query audit events in chronological order (descending for immediate UI feed)
    const logs = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Run cryptographic verification of ledger chain
    const verificationReport = await verifyAuditLedgerChain();

    // Map logs with rich metadata
    const auditLedger = logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      actorRole: log.actor,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      previousValue: log.previousValue,
      newValue: log.newValue,
      previousState: log.previousValue,
      newState: log.newValue,
      reason: log.reason,
      evidence: log.reason || `${log.action} on ${log.entityType} [${log.entityId}]`,
      source: log.source,
      entryHash: log.entryHash || log.id,
      prevHash: log.prevHash || "0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: log.timestamp.toISOString(),
    }));

    return NextResponse.json({
      auditLedger,
      totalEntriesCount: logs.length,
      ledgerIntegrityStatus: verificationReport.status,
      chainValid: verificationReport.isValid,
      verificationReport,
      isTamperEvident: true,
      statement: "Cryptographic hash chain is tamper-evident (SHA-256 block linking). Note: State defined as tamper-evident, not tamper-proof.",
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Audit ledger API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch audit ledger." },
      { status: 500 }
    );
  }
}
