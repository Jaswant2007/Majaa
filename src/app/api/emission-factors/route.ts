import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const factors = await prisma.emissionFactor.findMany({
      orderBy: [{ transportMode: "asc" }, { factor: "asc" }],
    });
    return NextResponse.json({ factors });
  } catch (error: unknown) {
    console.error("Emission factors API error:", error);
    return NextResponse.json({ error: "Failed to fetch emission factors." }, { status: 500 });
  }
}
