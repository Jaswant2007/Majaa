import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shipments = await prisma.shipment.findMany({
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
        document: {
          select: {
            id: true,
            filename: true,
            verificationStatus: true,
            sha256Hash: true,
          },
        },
        calculations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      shipments: shipments.map((s) => ({
        ...s,
        calculatedEmissionKgCO2e: s.calculations[0]?.result || 0,
        formulaUsed: s.calculations[0]?.formula || "distanceKm * weightTonnes * factor",
        factorApplied: 0.0962,
        verificationStatus: s.status,
        calculationRecord: s.calculations[0]
          ? {
              calculationId: s.calculations[0].calculationId,
              activityData: (() => {
                try {
                  return JSON.parse(s.calculations[0].activityData);
                } catch {
                  return { distanceKm: s.distanceKm, weightTonnes: s.weightTonnes };
                }
              })(),
              emissionFactorId: s.calculations[0].emissionFactorId,
              factorVersion: s.calculations[0].factorVersion,
              formula: s.calculations[0].formula,
              result: s.calculations[0].result,
              unit: s.calculations[0].unit,
              calculatedAt: s.calculations[0].calculatedAt,
            }
          : null,
      })),
    });
  } catch (error: unknown) {
    console.error("Shipments API error:", error);
    return NextResponse.json({ error: "Failed to fetch shipments." }, { status: 500 });
  }
}
