import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const healthResult: {
    status: "ok" | "degraded" | "error";
    timestamp: string;
    database: {
      status: "connected" | "error";
      queryTest?: boolean;
      supplierCount?: number;
      error?: string;
    };
    storage: {
      status: "connected" | "error";
      bucket?: string;
      error?: string;
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: { status: "connected" },
    storage: { status: "connected" },
  };

  let hasError = false;

  // 1. Database Health Check: SELECT 1 and count of Supplier
  try {
    await prisma.$queryRaw`SELECT 1`;
    const supplierCount = await prisma.supplier.count();

    healthResult.database = {
      status: "connected",
      queryTest: true,
      supplierCount,
    };
  } catch (dbError: any) {
    hasError = true;
    healthResult.database = {
      status: "error",
      error: dbError?.message ? "Database query failed" : "Unknown database error",
    };
  }

  // 2. Supabase Storage Health Check: supplier-documents bucket
  try {
    const admin = getAdminClient();
    const { data: bucket, error: bucketError } = await admin.storage.getBucket("supplier-documents");

    if (bucketError || !bucket) {
      hasError = true;
      healthResult.storage = {
        status: "error",
        bucket: "supplier-documents",
        error: bucketError?.message ?? "Bucket not found",
      };
    } else {
      healthResult.storage = {
        status: "connected",
        bucket: bucket.name,
      };
    }
  } catch (storageError: any) {
    hasError = true;
    healthResult.storage = {
      status: "error",
      error: storageError?.message ? "Storage connection failed" : "Unknown storage error",
    };
  }

  if (hasError) {
    healthResult.status = "error";
    return NextResponse.json(healthResult, { status: 503 });
  }

  return NextResponse.json(healthResult, { status: 200 });
}
