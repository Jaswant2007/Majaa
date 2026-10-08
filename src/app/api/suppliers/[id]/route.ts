import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateDataFreshness } from "@/lib/data-freshness";
import { generateExecutiveActions } from "@/lib/action-engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id;

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        parentSupplier: {
          select: { id: true, name: true, tier: true, registrationNo: true },
        },
        subSuppliers: {
          select: { id: true, name: true, tier: true, trustScore: true, status: true },
        },
        certificates: {
          orderBy: { expiryDate: "asc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            parentDoc: { select: { id: true, version: true } },
          },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
          include: {
            calculations: true,
          },
        },
        alerts: {
          orderBy: { createdAt: "desc" },
        },
        riskScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: `Supplier with ID ${supplierId} not found.` },
        { status: 404 }
      );
    }

    // Related audit events
    const docIds = supplier.documents.map((d) => d.id);
    const shipmentIds = supplier.shipments.map((s) => s.id);

    const auditTrail = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { entityType: "SUPPLIER", entityId: supplier.id },
          { entityType: "DOCUMENT", entityId: { in: docIds } },
          { entityType: "SHIPMENT", entityId: { in: shipmentIds } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 25,
    });

    // Calculate Scope-3 emissions totals and breakdown
    let totalEmissionsKg = 0;
    const modeBreakdown: Record<string, number> = {};
    const fuelBreakdown: Record<string, number> = {};

    supplier.shipments.forEach((shp) => {
      shp.calculations.forEach((c) => {
        totalEmissionsKg += c.result;
        modeBreakdown[shp.transportMode] =
          (modeBreakdown[shp.transportMode] || 0) + c.result;
        fuelBreakdown[shp.fuelType] =
          (fuelBreakdown[shp.fuelType] || 0) + c.result;
      });
    });

    const now = new Date();

    // Freshness calculation via configurable enterprise engine
    const freshness = calculateDataFreshness(supplier.lastVerifiedAt || supplier.createdAt);

    // Latest risk explanation
    const latestRisk = supplier.riskScores[0];
    let riskBreakdown = null;
    if (latestRisk?.breakdown) {
      try {
        riskBreakdown = JSON.parse(latestRisk.breakdown);
      } catch {
        riskBreakdown = null;
      }
    }

    // Generate prioritized Executive Actions (Rule 9)
    const executiveActions = generateExecutiveActions({
      supplier,
      certificates: supplier.certificates,
      documents: supplier.documents,
      alerts: supplier.alerts,
    });

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        normalizedName: supplier.normalizedName,
        registrationNo: supplier.registrationNo,
        country: supplier.country,
        tier: supplier.tier,
        status: supplier.status,
        trustScore: supplier.trustScore,
        blacklisted: supplier.blacklisted,
        lastVerifiedAt: supplier.lastVerifiedAt,
        parentSupplier: supplier.parentSupplier,
        subSuppliers: supplier.subSuppliers,
        freshness,
        daysSinceAudit: freshness.ageDays,
        isStale: freshness.status === "STALE",
      },
      riskAnalysis: {
        trustScore: supplier.trustScore,
        explanation: latestRisk?.explanation || "Continuous multi-factor compliance rating.",
        breakdown: riskBreakdown,
        computedAt: latestRisk?.computedAt || supplier.lastVerifiedAt,
      },
      emissions: {
        totalEmissionsKg: Math.round(totalEmissionsKg),
        totalEmissionsTonnes: Number((totalEmissionsKg / 1000).toFixed(2)),
        modeBreakdown,
        fuelBreakdown,
        shipmentCount: supplier.shipments.length,
      },
      certificates: supplier.certificates.map((c) => ({
        id: c.id,
        number: c.number,
        type: c.type,
        issuer: c.issuer,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: c.status,
        freshness: calculateDataFreshness(c.issueDate),
        daysRemaining: Math.ceil(
          (new Date(c.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      documents: supplier.documents.map((d) => ({
        id: d.id,
        filename: d.filename,
        version: d.version,
        sha256Hash: d.sha256Hash,
        verificationStatus: d.verificationStatus,
        extractionConfidence: d.extractionConfidence,
        freshness: calculateDataFreshness(d.createdAt),
        createdAt: d.createdAt,
      })),
      shipments: supplier.shipments.map((s) => ({
        id: s.id,
        manifestId: s.manifestId,
        origin: s.origin,
        destination: s.destination,
        distanceKm: s.distanceKm,
        weightTonnes: s.weightTonnes,
        transportMode: s.transportMode,
        fuelType: s.fuelType,
        status: s.status,
        emissionsKg: s.calculations.reduce((sum, c) => sum + c.result, 0),
        createdAt: s.createdAt,
      })),
      alerts: supplier.alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        whatHappened: a.whatHappened,
        whyItMatters: a.whyItMatters,
        evidence: a.evidence,
        recommendedAction: a.recommendedAction,
        status: a.status,
        createdAt: a.createdAt,
      })),
      auditTrail,
      freshness,
      executiveActions,
      recommendedActions: executiveActions,
    });
  } catch (error: any) {
    console.error("Supplier 360 API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch supplier profile." },
      { status: 500 }
    );
  }
}
