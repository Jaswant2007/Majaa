import { NextRequest, NextResponse } from "next/server";
import { executeJudgingDemoPipeline } from "@/lib/pipeline";
import { requireRole } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logStructuredEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const rateLimit = checkRateLimit(`upload:${clientIp}`, { limit: 30, windowSeconds: 60 });

  if (!rateLimit.allowed) {
    logStructuredEvent({
      operation: "PIPELINE_EXECUTE",
      status: 429,
      durationMs: Math.round(performance.now() - startTime),
      error: "Rate limit exceeded on document pipeline upload.",
      meta: { clientIp, resetSeconds: rateLimit.resetSeconds },
    });

    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 30 document submissions per minute allowed." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetSeconds) },
      }
    );
  }

  try {
    const authResult = await requireRole(req, [
      "ENTERPRISE_ADMIN",
      "COMPLIANCE_OFFICER",
      "SUSTAINABILITY_MANAGER",
      "SUPPLIER_USER",
    ]);

    if ("errorResponse" in authResult) {
      logStructuredEvent({
        operation: "PIPELINE_EXECUTE",
        status: 401,
        durationMs: Math.round(performance.now() - startTime),
        error: "Unauthorized pipeline upload access",
      });
      return authResult.errorResponse;
    }

    let filename = `manifest-${Date.now()}.txt`;
    let content = "";
    let supplierId = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      supplierId = (formData.get("supplierId") as string) || "";
      if (file) {
        filename = file.name;
        content = await file.text();
      } else {
        const textParam = formData.get("content") as string | null;
        if (textParam) content = textParam;
      }
    } else {
      const body = await req.json();
      filename = body.filename || filename;
      content = body.content || "";
      supplierId = body.supplierId || "";
    }

    if (!content.trim()) {
      logStructuredEvent({
        user: authResult.user.id,
        role: authResult.user.role,
        operation: "PIPELINE_EXECUTE",
        status: 400,
        durationMs: Math.round(performance.now() - startTime),
        error: "Manifest content is empty.",
      });
      return NextResponse.json({ error: "Manifest content is empty." }, { status: 400 });
    }

    const result = await executeJudgingDemoPipeline({
      filename,
      rawText: content,
      mimeType: filename.endsWith(".pdf") ? "application/pdf" : "text/plain",
      uploadedBy: authResult.user.id,
      supplierId,
    });

    logStructuredEvent({
      user: authResult.user.id,
      role: authResult.user.role,
      operation: "PIPELINE_EXECUTE",
      status: 200,
      durationMs: Math.round(performance.now() - startTime),
      entityType: "DOCUMENT",
      entityId: result.document?.id,
      meta: {
        filename,
        supplierId,
        complianceBadge: result.risk?.complianceBadge,
        anomaliesCount: result.anomalies?.length || 0,
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Pipeline execution failed";
    console.error("Pipeline execution failed:", err);

    logStructuredEvent({
      operation: "PIPELINE_EXECUTE",
      status: 500,
      durationMs: Math.round(performance.now() - startTime),
      error: errorMsg,
    });

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
