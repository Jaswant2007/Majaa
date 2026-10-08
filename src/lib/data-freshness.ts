export type FreshnessStatus = "FRESH" | "AGING" | "STALE";

export interface FreshnessResult {
  lastUpdated: string;
  dataAgeDays: number;
  ageDays: number;
  status: FreshnessStatus;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export interface FreshnessOptions {
  freshThresholdDays?: number; // Default: 30
  agingThresholdDays?: number; // Default: 90
}

/**
 * Calculates deterministic data freshness based on configurable enterprise thresholds.
 * Rule: FRESH (<=30d), AGING (31-90d), STALE (>90d).
 */
export function calculateDataFreshness(
  timestamp: Date | string | null | undefined,
  options: FreshnessOptions = {}
): FreshnessResult {
  const { freshThresholdDays = 30, agingThresholdDays = 90 } = options;

  if (!timestamp) {
    return {
      lastUpdated: "NEVER",
      dataAgeDays: 999,
      ageDays: 999,
      status: "STALE",
      badgeClass: "bg-accent/20 text-accent border-accent/40",
      dotColor: "bg-accent",
      description: "No verification timestamp recorded. Primary activity audit required.",
    };
  }

  const dateObj = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const dataAgeDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (dataAgeDays <= freshThresholdDays) {
    return {
      lastUpdated: dateObj.toISOString(),
      dataAgeDays,
      ageDays: dataAgeDays,
      status: "FRESH",
      badgeClass: "bg-tertiary/15 text-tertiary border-tertiary/30",
      dotColor: "bg-tertiary",
      description: `Verified within ${dataAgeDays} day(s). Complies with CSRD active disclosure rules.`,
    };
  }

  if (dataAgeDays <= agingThresholdDays) {
    return {
      lastUpdated: dateObj.toISOString(),
      dataAgeDays,
      ageDays: dataAgeDays,
      status: "AGING",
      badgeClass: "bg-accent/15 text-accent border-accent/30",
      dotColor: "bg-accent",
      description: `Disclosure is ${dataAgeDays} days old. Approaching quarterly renewal window.`,
    };
  }

  return {
    lastUpdated: dateObj.toISOString(),
    dataAgeDays,
    ageDays: dataAgeDays,
    status: "STALE",
    badgeClass: "bg-accent/20 text-accent border-accent/40",
    dotColor: "bg-accent",
    description: `Audit data is ${dataAgeDays} days old (>90 days). Downgrade risk applied until refreshed.`,
  };
}
