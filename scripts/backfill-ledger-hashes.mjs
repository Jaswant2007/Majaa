import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

function computeEntryHash(prevHash, timestamp, actor, action, entityType, entityId, previousValue, newValue, source, reason) {
  const payload = [
    prevHash,
    new Date(timestamp).toISOString(),
    (actor || '').trim(),
    (action || '').trim(),
    (entityType || '').trim(),
    (entityId || '').trim(),
    previousValue || '',
    newValue || '',
    (source || '').trim(),
    reason || ''
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function backfill() {
  console.log('--- Backfilling cryptographic tamper-evident hashes on AuditEvent table ---');
  const entries = await prisma.auditEvent.findMany({
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
  });

  console.log(`Found ${entries.length} audit entries.`);
  let prevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryHash = computeEntryHash(
      prevHash,
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

    await prisma.auditEvent.update({
      where: { id: entry.id },
      data: {
        prevHash,
        entryHash
      }
    });

    prevHash = entryHash;
  }

  console.log(`Successfully anchored ${entries.length} blocks into continuous SHA-256 chain! Head hash: ${prevHash}`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
