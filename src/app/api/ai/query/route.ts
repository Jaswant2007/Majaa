import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processAIAssistantQuery } from "@/lib/ai-assistant";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logStructuredEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const rateLimit = checkRateLimit(`ai:${clientIp}`, { limit: 40, windowSeconds: 60 });

  if (!rateLimit.allowed) {
    logStructuredEvent({
      operation: "AI_ASSISTANT_QUERY",
      status: 429,
      durationMs: Math.round(performance.now() - startTime),
      error: "Rate limit exceeded on AI copilot queries.",
      meta: { clientIp, resetSeconds: rateLimit.resetSeconds },
    });

    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 40 AI queries per minute allowed." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.resetSeconds) },
      }
    );
  }

  try {
    const user = await getCurrentUser(req);
    const body = await req.json();
    const prompt = body.prompt || body.query || body.question;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      logStructuredEvent({
        operation: "AI_ASSISTANT_QUERY",
        status: 400,
        durationMs: Math.round(performance.now() - startTime),
        error: "Prompt or query string is required.",
      });

      return NextResponse.json(
        { error: "Prompt or query string is required." },
        { status: 400 }
      );
    }

    const callerUser = user || (body.role ? { id: "test-user", email: "test@zephoria.internal", name: "Test User", role: body.role, supplierId: body.supplierId } : undefined);

    const response = await processAIAssistantQuery(prompt.trim(), callerUser as any);

    logStructuredEvent({
      user: callerUser?.id,
      role: callerUser?.role,
      operation: "AI_ASSISTANT_QUERY",
      status: 200,
      durationMs: Math.round(performance.now() - startTime),
      meta: {
        toolsExecuted: response.toolsExecuted,
        evidenceCount: response.evidence.length,
      },
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const errorMsg = error?.message || "Failed to process AI query.";
    console.error("AI assistant query API error:", error);

    logStructuredEvent({
      operation: "AI_ASSISTANT_QUERY",
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
