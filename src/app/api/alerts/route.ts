import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (severity && severity !== "ALL") where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            registrationNo: true,
            tier: true,
            trustScore: true,
            status: true,
          },
        },
        document: {
          select: {
            id: true,
            filename: true,
            version: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ alerts, count: alerts.length });
  } catch (error: any) {
    console.error("Alerts API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch alerts." },
      { status: 500 }
    );
  }
}
