import { NextResponse } from "next/server";
import { verifyAuditLedgerChain } from "@/lib/audit-ledger";

export const dynamic = "force-dynamic";

/**
 * Audit Ledger Verification Endpoint
 * Validates cryptographic SHA-256 block hash chain across all chronological records.
 * Explicitly states tamper-evidence (not tamper-proof).
 */
export async function GET() {
  try {
    const report = await verifyAuditLedgerChain();
    return NextResponse.json({
      ...report,
      isTamperEvident: true,
      disclosureNotice:
        "The SourceTrace audit ledger uses SHA-256 block linking to provide cryptographic tamper-evidence. Any historical block mutation breaks the forward hash chain.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to verify ledger chain." },
      { status: 500 }
    );
  }
}
