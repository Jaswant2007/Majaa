import crypto from 'crypto';
import { prisma } from './db';

export interface CreateAuditEntryParams {
  actor: string;
  action:
    | 'UPLOAD'
    | 'EXTRACTION'
    | 'IDENTITY_CHECK'
    | 'CERT_CHECK'
    | 'CALCULATION'
    | 'RISK_CHANGE'
    | 'STATUS_CHANGE'
    | 'ALERT_CREATED'
    | 'MANUAL_REVIEW'
    | 'DOCUMENT_VERSIONED'
    | 'VERIFIED'
    | 'FLAGGED'
    | 'REJECTED';
  entityType:
    | 'DOCUMENT'
    | 'SHIPMENT'
    | 'CERTIFICATE'
    | 'SUPPLIER'
    | 'CALCULATION'
    | 'ALERT'
    | 'RISK_SCORE';
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  source?: string;
  reason?: string | null;
}

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Deterministically compute the SHA-256 block hash for an audit ledger entry.
 * Note: Stated explicitly as TAMPER-EVIDENT (cryptographic chaining), not tamper-proof.
 */
export function computeEntryHash(
  prevHash: string,
  timestamp: Date,
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  previousValue: string | null,
  newValue: string | null,
  source: string,
  reason: string | null
): string {
  const payload = [
    prevHash,
    timestamp.toISOString(),
    actor.trim(),
    action.trim(),
    entityType.trim(),
    entityId.trim(),
    previousValue || '',
    newValue || '',
    source.trim(),
    reason || ''
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Append an immutable event to the tamper-evident audit ledger within an optional transaction.
 * Usage: logAudit(tx, {...})
 */
export async function logAudit(tx: any, params: CreateAuditEntryParams) {
  const db = tx || prisma;
  const timestamp = new Date();

  // Find the latest audit entry in the chronological chain
  const latestEntry = await db.auditEvent.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { entryHash: true },
  });

  const prevHash = latestEntry?.entryHash || GENESIS_PREV_HASH;
  const source = params.source || 'ZERO_TRUST_PIPELINE';

  const entryHash = computeEntryHash(
    prevHash,
    timestamp,
    params.actor,
    params.action,
    params.entityType,
    params.entityId,
    params.previousValue ?? null,
    params.newValue ?? null,
    source,
    params.reason ?? null
  );

  return db.auditEvent.create({
    data: {
      actor: params.actor,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousValue: params.previousValue ?? null,
      newValue: params.newValue ?? null,
      source,
      reason: params.reason ?? null,
      entryHash,
      prevHash,
      timestamp,
    },
  });
}

/**
 * Append an immutable event to the tamper-evident audit ledger using the global Prisma client.
 */
export async function recordAuditEvent(params: CreateAuditEntryParams) {
  return logAudit(prisma, params);
}

export interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  verifiedBlocks: number;
  status: 'VERIFIED_TAMPER_EVIDENT' | 'CORRUPTED_CHAIN';
  corruptedBlockIndex?: number;
  corruptedBlockId?: string;
  error?: string;
  headHash?: string;
}

/**
 * Verifies the entire audit ledger chain.
 * Re-computes entry hashes and checks each prevHash pointer.
 */
export async function verifyAuditLedgerChain(): Promise<VerificationResult> {
  const entries = await prisma.auditEvent.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
  });

  if (entries.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      verifiedBlocks: 0,
      status: 'VERIFIED_TAMPER_EVIDENT',
      headHash: GENESIS_PREV_HASH
    };
  }

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check prevHash continuity
    if (entry.prevHash && entry.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalEntries: entries.length,
        verifiedBlocks: i,
        status: 'CORRUPTED_CHAIN',
        corruptedBlockIndex: i,
        corruptedBlockId: entry.id,
        error: `PrevHash mismatch at index ${i}: expected ${expectedPrevHash}, found ${entry.prevHash}`
      };
    }

    // Verify recalculation of entryHash
    if (entry.entryHash) {
      const recomputedHash = computeEntryHash(
        entry.prevHash || expectedPrevHash,
        entry.timestamp,
        entry.actor,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.previousValue,
        entry.newValue,
        entry.source,
        entry.reason
      );

      if (recomputedHash !== entry.entryHash) {
        return {
          isValid: false,
          totalEntries: entries.length,
          verifiedBlocks: i,
          status: 'CORRUPTED_CHAIN',
          corruptedBlockIndex: i,
          corruptedBlockId: entry.id,
          error: `Tampering detected at block ${entry.id}: stored hash ${entry.entryHash} differs from cryptographic hash ${recomputedHash}`
        };
      }
    }

    expectedPrevHash = entry.entryHash || expectedPrevHash;
  }

  return {
    isValid: true,
    totalEntries: entries.length,
    verifiedBlocks: entries.length,
    status: 'VERIFIED_TAMPER_EVIDENT',
    headHash: expectedPrevHash
  };
}
