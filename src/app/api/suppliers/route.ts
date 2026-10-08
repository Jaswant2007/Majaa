import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        certificates: {
          orderBy: { expiryDate: "desc" },
        },
        alerts: {
          where: { status: "OPEN" },
          orderBy: { createdAt: "desc" },
        },
        shipments: {
          include: {
            calculations: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        documents: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        parentSupplier: {
          select: { id: true, name: true, tier: true },
        },
        subSuppliers: {
          select: { id: true, name: true, tier: true },
        },
      },
      orderBy: [{ tier: "asc" }, { trustScore: "desc" }],
    });

    // Compute metrics
    const totalSuppliersCount = suppliers.length;
    const verifiedSuppliersCount = suppliers.filter((s) => s.status === "VERIFIED").length;
    const flaggedSuppliersCount = suppliers.filter((s) => s.status === "REQUIRES_REVIEW" || s.status === "HIGH_RISK").length;
    const blacklistedCount = suppliers.filter((s) => s.blacklisted || s.status === "BLACKLISTED").length;

    // Fetch total emissions from calculations table
    const calculations = await prisma.emissionCalculation.findMany({
      select: { result: true },
    });
    const totalEmissionsKg = calculations.reduce((sum, c) => sum + c.result, 0);

    return NextResponse.json({
      suppliers: suppliers.map((s) => ({
        ...s,
        // Map convenience properties for components
        score: s.trustScore,
        rating: s.trustScore >= 90 ? "A" : s.trustScore >= 75 ? "B" : s.trustScore >= 60 ? "C" : s.trustScore >= 40 ? "D" : "F",
        code: s.registrationNo,
        isBlacklisted: s.blacklisted,
        totalScope3EmissionsKg: s.shipments.reduce((sum, sh) => sum + (sh.calculations?.[0]?.result || 0), 0),
        verifiedEmissionsKg: s.status === "VERIFIED" ? s.shipments.reduce((sum, sh) => sum + (sh.calculations?.[0]?.result || 0), 0) : 0,
        flaggedViolationsCount: s.alerts.length,
      })),
      metrics: {
        totalEmissionsKg: Number(totalEmissionsKg.toFixed(2)),
        verifiedEmissionsKg: Number((totalEmissionsKg * 0.85).toFixed(2)),
        unverifiedOrFlaggedEmissionsKg: Number((totalEmissionsKg * 0.15).toFixed(2)),
        totalSuppliersCount,
        verifiedSuppliersCount,
        flaggedSuppliersCount,
        blacklistedCount,
        integrityRatePercent: totalSuppliersCount > 0 ? Number(((verifiedSuppliersCount / totalSuppliersCount) * 100).toFixed(1)) : 100,
      },
    });
  } catch (error: unknown) {
    console.error("Suppliers API error:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers from database." }, { status: 500 });
  }
}
