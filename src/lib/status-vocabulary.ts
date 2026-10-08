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
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    dotColor: "bg-emerald-400",
  },
  COMPLIANT: {
    label: "COMPLIANT",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    dotColor: "bg-emerald-400",
  },
  "ACTION REQUIRED": {
    label: "ACTION REQUIRED",
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    dotColor: "bg-amber-400",
  },
  "UNDER REVIEW": {
    label: "UNDER REVIEW",
    classes: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    dotColor: "bg-cyan-400",
  },
  "HIGH RISK": {
    label: "HIGH RISK",
    classes: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    dotColor: "bg-rose-400",
  },
  EXPIRED: {
    label: "EXPIRED",
    classes: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    dotColor: "bg-purple-400",
  },
  STALE: {
    label: "STALE",
    classes: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    dotColor: "bg-orange-400",
  },
  SUSPICIOUS: {
    label: "SUSPICIOUS",
    classes: "bg-rose-500/20 text-rose-200 border-rose-500/50",
    dotColor: "bg-rose-500",
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
