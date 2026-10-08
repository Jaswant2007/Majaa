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
      badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      dotColor: "bg-rose-400",
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
      badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      dotColor: "bg-emerald-400",
      description: `Verified within ${dataAgeDays} day(s). Complies with CSRD active disclosure rules.`,
    };
  }

  if (dataAgeDays <= agingThresholdDays) {
    return {
      lastUpdated: dateObj.toISOString(),
      dataAgeDays,
      ageDays: dataAgeDays,
      status: "AGING",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dotColor: "bg-amber-400",
      description: `Disclosure is ${dataAgeDays} days old. Approaching quarterly renewal window.`,
    };
  }

  return {
    lastUpdated: dateObj.toISOString(),
    dataAgeDays,
    ageDays: dataAgeDays,
    status: "STALE",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dotColor: "bg-orange-400",
    description: `Audit data is ${dataAgeDays} days old (>90 days). Downgrade risk applied until refreshed.`,
  };
}
