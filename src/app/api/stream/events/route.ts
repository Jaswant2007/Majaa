import { NextResponse } from "next/server";
import { realtimeBus } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected","timestamp":"${new Date().toISOString()}"}\n\n`));

      // Subscribe to internal real-time event bus
      const unsubscribe = realtimeBus.subscribe((msg) => {
        try {
          controller.enqueue(encoder.encode(msg));
        } catch {
          // Stream might be closed
        }
      });

      // Keep connection alive every 25 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {"time":${Date.now()}}\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25000);

      // Clean up on cancel
      return () => {
        clearInterval(pingInterval);
        unsubscribe();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
