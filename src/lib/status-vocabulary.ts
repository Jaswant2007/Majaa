/**
 * Consistent Enterprise Status Vocabulary & Styling
 * Standardized across all 10 application views (Rule 7)
 */

export type StatusVocabulary =
  | "VERIFIED"
  | "COMPLIANT"
  | "ACTION REQUIRED"
  | "UNDER REVIEW"
  | "HIGH RISK"
  | "EXPIRED"
  | "STALE"
  | "SUSPICIOUS";

export interface StatusBadgeConfig {
  label: StatusVocabulary;
  classes: string;
  dotColor: string;
}

export const STATUS_BADGE_CONFIGS: Record<StatusVocabulary, StatusBadgeConfig> = {
  VERIFIED: {
    label: "VERIFIED",
    classes: "bg-tertiary/15 text-tertiary border-tertiary/40",
    dotColor: "bg-tertiary",
  },
  COMPLIANT: {
    label: "COMPLIANT",
    classes: "bg-tertiary/15 text-tertiary border-tertiary/40",
    dotColor: "bg-tertiary",
  },
  "ACTION REQUIRED": {
    label: "ACTION REQUIRED",
    classes: "bg-accent/15 text-accent border-accent/40",
    dotColor: "bg-accent",
  },
  "UNDER REVIEW": {
    label: "UNDER REVIEW",
    classes: "bg-tertiary/15 text-tertiary border-tertiary/40",
    dotColor: "bg-tertiary",
  },
  "HIGH RISK": {
    label: "HIGH RISK",
    classes: "bg-accent/20 text-accent border-accent/50",
    dotColor: "bg-accent",
  },
  EXPIRED: {
    label: "EXPIRED",
    classes: "bg-accent/20 text-accent border-accent/50",
    dotColor: "bg-accent",
  },
  STALE: {
    label: "STALE",
    classes: "bg-accent/15 text-accent border-accent/40",
    dotColor: "bg-accent",
  },
  SUSPICIOUS: {
    label: "SUSPICIOUS",
    classes: "bg-accent/25 text-accent border-accent/60",
    dotColor: "bg-accent",
  },
};

export function getStatusConfig(status: string): StatusBadgeConfig {
  const normalized = status.trim().toUpperCase().replace(/_/g, " ");

  if (normalized === "VERIFIED") return STATUS_BADGE_CONFIGS.VERIFIED;
  if (normalized === "COMPLIANT") return STATUS_BADGE_CONFIGS.COMPLIANT;
  if (normalized === "REQUIRES REVIEW" || normalized === "ACTION REQUIRED") {
    return STATUS_BADGE_CONFIGS["ACTION REQUIRED"];
  }
  if (normalized === "UNDER REVIEW" || normalized === "INVESTIGATING") {
    return STATUS_BADGE_CONFIGS["UNDER REVIEW"];
  }
  if (normalized === "HIGH RISK" || normalized === "BLACKLISTED" || normalized === "REJECTED") {
    return STATUS_BADGE_CONFIGS["HIGH RISK"];
  }
  if (normalized === "EXPIRED") return STATUS_BADGE_CONFIGS.EXPIRED;
  if (normalized === "STALE" || normalized === "EXPIRING SOON") return STATUS_BADGE_CONFIGS.STALE;
  if (normalized === "SUSPICIOUS" || normalized === "FLAGGED") return STATUS_BADGE_CONFIGS.SUSPICIOUS;

  return {
    label: status as StatusVocabulary,
    classes: "bg-slate-800 text-slate-300 border-slate-700",
    dotColor: "bg-slate-400",
  };
}
