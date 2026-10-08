import { CertificateValidationStatus, ComplianceBadge } from "./types-pipeline";

export interface RiskWeights {
  compliance: number; // 25
  documentIntegrity: number; // 20
  dataFreshness: number; // 15
  certificateStatus: number; // 15
  historicalRisk: number; // 15
  completeness: number; // 10
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  compliance: 25,
  documentIntegrity: 20,
  dataFreshness: 15,
  certificateStatus: 15,
  historicalRisk: 15,
  completeness: 10,
};

export interface RiskEvaluationParams {
  previousScore: number;
  isBlacklisted: boolean;
  hasIdentityMismatch: boolean;
  certificateStatus: CertificateValidationStatus;
  isDuplicateDocument: boolean;
  lowConfidenceFieldsCount: number;
  monthsSinceLastVerification: number;
  unresolvedAlertsCount: number;
  missingRequiredFieldsCount: number;
  weights?: RiskWeights;
}

export interface RiskEvaluationResult {
  previousScore: number;
  newScore: number;
  scoreDelta: number;
  breakdown: {
    complianceScore: number; // out of 25
    documentIntegrityScore: number; // out of 20
    dataFreshnessScore: number; // out of 15
    certificateStatusScore: number; // out of 15
    historicalRiskScore: number; // out of 15
    completenessScore: number; // out of 10
  };
  explanations: string[];
  complianceBadge: ComplianceBadge;
}

/**
 * Weighted Risk & Trust Score Engine
 */
export function calculateWeightedRiskScore(params: RiskEvaluationParams): RiskEvaluationResult {
  const w = params.weights || DEFAULT_RISK_WEIGHTS;
  const explanations: string[] = [];

  if (params.isBlacklisted) {
    return {
      previousScore: params.previousScore,
      newScore: 12.0,
      scoreDelta: Number((12.0 - params.previousScore).toFixed(1)),
      breakdown: {
        complianceScore: 0,
        documentIntegrityScore: 0,
        dataFreshnessScore: 0,
        certificateStatusScore: 0,
        historicalRiskScore: 0,
        completenessScore: 0,
      },
      explanations: [
        "CRITICAL: Entity matches international sanctions / OFAC trade embargo list.",
        "Automatic minimum trust rating enforced.",
      ],
      complianceBadge: "HIGH RISK",
    };
  }

  // 1. Compliance (Max 25)
  let complianceScore = w.compliance;
  if (params.hasIdentityMismatch) {
    complianceScore = 0;
    explanations.push("Risk increased by -25 pts: Supplier identity in manifest does not match registered corporate credentials.");
  } else if (params.unresolvedAlertsCount > 2) {
    complianceScore = Math.max(5, complianceScore - 15);
    explanations.push(`Risk increased by -15 pts: ${params.unresolvedAlertsCount} unresolved compliance alerts outstanding.`);
  }

  // 2. Document Integrity (Max 20)
  let documentIntegrityScore = w.documentIntegrity;
  if (params.isDuplicateDocument) {
    documentIntegrityScore = Math.max(0, documentIntegrityScore - 15);
    explanations.push("Risk increased by -15 pts: Duplicate document SHA-256 hash detected.");
  }
  if (params.lowConfidenceFieldsCount > 0) {
    const penalty = Math.min(10, params.lowConfidenceFieldsCount * 3);
    documentIntegrityScore = Math.max(0, documentIntegrityScore - penalty);
    explanations.push(`Risk increased by -${penalty} pts: ${params.lowConfidenceFieldsCount} extracted fields fell below confidence threshold (0.80).`);
  }

  // 3. Data Freshness (Max 15)
  let dataFreshnessScore = w.dataFreshness;
  if (params.monthsSinceLastVerification > 12) {
    dataFreshnessScore = 0;
    explanations.push(`Risk increased by -15 pts: Stale audit baseline (> ${params.monthsSinceLastVerification} months since empirical verification).`);
  } else if (params.monthsSinceLastVerification > 6) {
    dataFreshnessScore = 7.5;
    explanations.push("Risk increased by -7.5 pts: Audit baseline older than 6 months.");
  }

  // 4. Certificate Status (Max 15)
  let certificateStatusScore = w.certificateStatus;
  switch (params.certificateStatus) {
    case "VALID":
      certificateStatusScore = 15;
      break;
    case "EXPIRING_SOON":
      certificateStatusScore = 10;
      explanations.push("Risk increased by -5 pts: Environmental certificate expiring within 5 calendar days.");
      break;
    case "EXPIRED":
      certificateStatusScore = 0;
      explanations.push("Risk increased by -15 pts: Environmental certificate EXPIRED; logistics operating uncertified.");
      break;
    case "MISMATCH":
      certificateStatusScore = 0;
      explanations.push("Risk increased by -15 pts: Certificate referenced belongs to an unlinked third party.");
      break;
    case "INVALID":
    case "MISSING":
      certificateStatusScore = 3;
      explanations.push("Risk increased by -12 pts: No verified ISO-14064 or equivalent certificate on file.");
      break;
  }

  // 5. Historical Risk (Max 15)
  let historicalRiskScore = w.historicalRisk;
  if (params.unresolvedAlertsCount > 0) {
    const penalty = Math.min(15, params.unresolvedAlertsCount * 5);
    historicalRiskScore = Math.max(0, historicalRiskScore - penalty);
    explanations.push(`Risk increased by -${penalty} pts: Historic violation flags pending audit resolution.`);
  }

  // 6. Completeness (Max 10)
  let completenessScore = w.completeness;
  if (params.missingRequiredFieldsCount > 0) {
    const penalty = Math.min(10, params.missingRequiredFieldsCount * 3);
    completenessScore = Math.max(0, completenessScore - penalty);
    explanations.push(`Risk increased by -${penalty} pts: ${params.missingRequiredFieldsCount} required manifest fields missing or unparseable.`);
  }

  const rawTotal =
    complianceScore +
    documentIntegrityScore +
    dataFreshnessScore +
    certificateStatusScore +
    historicalRiskScore +
    completenessScore;

  const newScore = Number(Math.max(0, Math.min(100, rawTotal)).toFixed(1));
  const scoreDelta = Number((newScore - params.previousScore).toFixed(1));

  let complianceBadge: ComplianceBadge = "COMPLIANT";
  if (newScore < 45 || params.hasIdentityMismatch || params.certificateStatus === "MISMATCH") {
    complianceBadge = "HIGH RISK";
  } else if (newScore < 70 || params.certificateStatus === "EXPIRED") {
    complianceBadge = "ACTION REQUIRED";
  } else if (newScore < 85 || params.certificateStatus === "EXPIRING_SOON") {
    complianceBadge = "UNDER REVIEW";
  } else {
    complianceBadge = "COMPLIANT";
  }

  return {
    previousScore: params.previousScore,
    newScore,
    scoreDelta,
    breakdown: {
      complianceScore,
      documentIntegrityScore,
      dataFreshnessScore,
      certificateStatusScore,
      historicalRiskScore,
      completenessScore,
    },
    explanations,
    complianceBadge,
  };
}
