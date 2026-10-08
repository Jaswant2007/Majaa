import crypto from "crypto";

export interface StructuredLogEntry {
  timestamp: string;
  requestId: string;
  user?: string;
  role?: string;
  operation: string;
  durationMs: number;
  status: number;
  error?: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, any>;
}

/**
 * Enterprise Structured Server Logger
 * Outputs NDJSON format with request tracing, duration, status, and entity correlation.
 */
export function logStructuredEvent(entry: Omit<StructuredLogEntry, "timestamp" | "requestId"> & { requestId?: string }) {
  const log: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    requestId: entry.requestId || `REQ-${crypto.randomBytes(6).toString("hex")}`,
    user: entry.user || "ANONYMOUS",
    role: entry.role || "UNAUTHENTICATED",
    operation: entry.operation,
    durationMs: entry.durationMs,
    status: entry.status,
    error: entry.error,
    entityType: entry.entityType,
    entityId: entry.entityId,
    meta: entry.meta,
  };

  const jsonStr = JSON.stringify(log);

  if (log.status >= 500) {
    console.error(`[STRUCTURED_LOG:ERROR] ${jsonStr}`);
  } else if (log.status >= 400) {
    console.warn(`[STRUCTURED_LOG:WARN] ${jsonStr}`);
  } else {
    console.log(`[STRUCTURED_LOG:INFO] ${jsonStr}`);
  }

  return log;
}
