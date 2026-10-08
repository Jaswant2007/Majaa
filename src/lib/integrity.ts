import crypto from "crypto";
import { prisma } from "./db";
import { calculateFreightScope3Emissions } from "./calculator";
import { ManifestExtraction, CertificateExtraction } from "./schemas";

export interface VerificationCheckResult {
  passed: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  alertType?: "EXPIRED_CERT" | "EXPIRING_SOON" | "BLACKLIST_HIT" | "IDENTITY_MISMATCH" | "HIGH_EMISSIONS" | "STALE_DATA" | "MISSING_DOC" | "SUSPICIOUS_DOC";
  whatHappened: string;
  whyItMatters: string;
  evidence: Record<string, unknown> | string;
  recommendedAction: string;
}

/**
 * Re-computes supplier Trust Score (0 - 100) and Status
 */
export function computeSupplierTrustScore(params: {
  currentScore: number;
  unresolvedViolations: number;
  hasExpiredCert: boolean;
  isBlacklisted: boolean;
}): { score: number; status: string } {
  if (params.isBlacklisted) {
    return { score: 15.0, status: "BLACKLISTED" };
  }

  let score = 95.0;
  score -= params.unresolvedViolations * 15.0;
  if (params.hasExpiredCert) {
    score -= 25.0;
  }

  score = Math.max(0, Math.min(100, Number(score.toFixed(1))));

  let status = "VERIFIED";
  if (score >= 85) status = "VERIFIED";
  else if (score >= 65) status = "REQUIRES_REVIEW";
  else status = "HIGH_RISK";

  return { score, status };
}

/**
 * Core ACID Transaction Verification Pipeline (Rule 7)
 */
export async function executeDocumentVerificationPipeline(params: {
  documentId: string;
  supplierId: string;
  extractedData: ManifestExtraction | CertificateExtraction;
  docType: "LOGISTICS_MANIFEST" | "COMPLIANCE_CERT" | "UTILITY_BILL";
  actorRole?: string;
}) {
  const { documentId, supplierId, extractedData, docType, actorRole = "ENTERPRISE_ADMIN" } = params;

  // 1. Fetch supplier
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      certificates: true,
      alerts: { where: { status: "OPEN" } },
    },
  });

  if (!supplier) {
    throw new Error(`Supplier with id [${supplierId}] not found in database.`);
  }

  const anomalyFindings: VerificationCheckResult[] = [];

  // Check 1: Blacklist & Sanctions Match
  const blacklistHit = await prisma.blacklistEntry.findFirst({
    where: {
      entityName: supplier.name,
      active: true,
    },
  });

  if (supplier.blacklisted || blacklistHit) {
    anomalyFindings.push({
      passed: false,
      severity: "CRITICAL",
      alertType: "BLACKLIST_HIT",
      whatHappened: `Entity match detected on active sanctions list: ${blacklistHit?.listingSource || "OFAC/OECD Restrictions"}`,
      whyItMatters: `Corporate criminal liability under trade embargo rules for engaging sanctioned entities in Scope-3 operations.`,
      evidence: { entity: supplier.name, source: blacklistHit?.listingSource || "Internal Blacklist", reason: blacklistHit?.reason },
      recommendedAction: `Immediate hard-block on supplier consignments; escalate to Compliance Officer.`,
    });
  }

  if (docType === "LOGISTICS_MANIFEST") {
    const manifest = extractedData as ManifestExtraction;

    // Check 2: Supplier Identity Consistency
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const nameMatch =
      normalize(manifest.supplierName).includes(normalize(supplier.name)) ||
      normalize(supplier.name).includes(normalize(manifest.supplierName));

    if (!nameMatch) {
      anomalyFindings.push({
        passed: false,
        severity: "CRITICAL",
        alertType: "IDENTITY_MISMATCH",
        whatHappened: `Manifest shipper "${manifest.supplierName}" conflicts with registered supplier "${supplier.name}" (${supplier.registrationNo}).`,
        whyItMatters: `Potential unauthorized third-party entity masquerading to circumvent trade restrictions or carbon accounting.`,
        evidence: { declaredInManifest: manifest.supplierName, registeredInDb: supplier.name, supplierId: supplier.id },
        recommendedAction: `Demand physical bill of lading and chain-of-custody verification.`,
      });
    }

    // Check 3: Certificate Validity in DB
    let certExpired = false;
    if (manifest.certificateRef) {
      const certRecord = await prisma.certificate.findFirst({
        where: { number: manifest.certificateRef },
      });

      if (!certRecord) {
        anomalyFindings.push({
          passed: false,
          severity: "WARNING",
          alertType: "SUSPICIOUS_DOC",
          whatHappened: `Manifest cites certificate ref "${manifest.certificateRef}", which does not exist in registry.`,
          whyItMatters: `Unregistered claims prevent third-party audit verification under EU CSRD assurance rules.`,
          evidence: { citedRef: manifest.certificateRef, registryStatus: "NOT_FOUND" },
          recommendedAction: `Request verified certificate PDF from vendor portal.`,
        });
      } else {
        if (certRecord.supplierId !== supplier.id) {
          anomalyFindings.push({
            passed: false,
            severity: "CRITICAL",
            alertType: "IDENTITY_MISMATCH",
            whatHappened: `Certificate "${manifest.certificateRef}" belongs to another supplier entity.`,
            whyItMatters: `Falsification of compliance credentials constitutes fraudulent ESG disclosure.`,
            evidence: { certOwnerId: certRecord.supplierId, uploaderSupplierId: supplier.id },
            recommendedAction: `Reject manifest and open compliance investigation.`,
          });
        }

        const now = new Date();
        if (certRecord.expiryDate < now || certRecord.status === "EXPIRED") {
          certExpired = true;
          anomalyFindings.push({
            passed: false,
            severity: "CRITICAL",
            alertType: "EXPIRED_CERT",
            whatHappened: `Manifest executed under expired environmental certificate ${certRecord.number}.`,
            whyItMatters: `Expired GHG verification results in non-compliant Scope-3 emissions calculations.`,
            evidence: { certNumber: certRecord.number, expiredOn: certRecord.expiryDate.toISOString().split("T")[0] },
            recommendedAction: `Reject clearance until renewed ISO-14064 certification is validated.`,
          });
        }
      }
    }

    // Check 4: Deterministic Scope-3 Calculation (Zero LLM calculation)
    const calcResult = await calculateFreightScope3Emissions({
      distanceKm: manifest.distanceKm,
      weightTonnes: manifest.weightTonnes,
      transportMode: manifest.transportMode,
      fuelType: manifest.fuelType,
    });

    const hasCritical = anomalyFindings.some((a) => a.severity === "CRITICAL");
    const hasWarning = anomalyFindings.some((a) => a.severity === "WARNING");

    const finalDocVerificationStatus = hasCritical ? "REJECTED" : hasWarning ? "REQUIRES_REVIEW" : "VERIFIED";
    const finalDocProcessingStatus = "EXTRACTED";

    // Recalculate trust score
    const totalViolations = supplier.alerts.length + anomalyFindings.length;
    const { score: newScore, status: newStatus } = computeSupplierTrustScore({
      currentScore: supplier.trustScore,
      unresolvedViolations: totalViolations,
      hasExpiredCert: certExpired,
      isBlacklisted: supplier.blacklisted || !!blacklistHit,
    });

    // 5. ACID TRANSACTION EXECUTION (Rule 7)
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Update Document record
      const updatedDoc = await tx.document.update({
        where: { id: documentId },
        data: {
          processingStatus: finalDocProcessingStatus,
          verificationStatus: finalDocVerificationStatus,
          extractedJson: JSON.stringify(manifest),
          validationNotes: `Integrity evaluation completed: ${anomalyFindings.length} anomalies detected.`,
        },
      });

      // Step B: Record Shipment
      const shipment = await tx.shipment.create({
        data: {
          supplierId: supplier.id,
          documentId,
          manifestId: manifest.manifestId,
          origin: manifest.origin,
          destination: manifest.destination,
          distanceKm: manifest.distanceKm,
          weightTonnes: manifest.weightTonnes,
          transportMode: manifest.transportMode,
          fuelType: manifest.fuelType,
          carrierName: manifest.carrierName || "Dedicated Fleet",
          status: finalDocVerificationStatus === "VERIFIED" ? "VERIFIED" : "FLAGGED",
        },
      });

      // Step C: Record Deterministic Calculation Trace
      const calcRecord = await tx.emissionCalculation.create({
        data: {
          calculationId: `CALC-${manifest.manifestId}-${Date.now().toString().slice(-4)}`,
          shipmentId: shipment.id,
          activityData: JSON.stringify({
            distanceKm: manifest.distanceKm,
            weightTonnes: manifest.weightTonnes,
            tonneKm: calcResult.activityDataTonneKm,
          }),
          emissionFactorId: calcResult.emissionFactorId,
          factorVersion: calcResult.factorVersion,
          formula: calcResult.formulaUsed,
          result: calcResult.totalKgCO2e,
          unit: "kg_CO2e",
        },
      });

      // Step D: Create explainable alerts
      const createdAlerts = [];
      for (const finding of anomalyFindings) {
        const alert = await tx.alert.create({
          data: {
            supplierId: supplier.id,
            documentId,
            severity: finding.severity,
            type: finding.alertType || "SUSPICIOUS_DOC",
            whatHappened: finding.whatHappened,
            whyItMatters: finding.whyItMatters,
            evidence: typeof finding.evidence === "string" ? finding.evidence : JSON.stringify(finding.evidence),
            recommendedAction: finding.recommendedAction,
            status: "OPEN",
          },
        });
        createdAlerts.push(alert);
      }

      // Step E: Update Supplier trust score & status
      const updatedSupplier = await tx.supplier.update({
        where: { id: supplier.id },
        data: {
          trustScore: newScore,
          status: newStatus,
          lastVerifiedAt: new Date(),
        },
      });

      // Step F: Append Audit Event
      const auditEvent = await tx.auditEvent.create({
        data: {
          actor: actorRole,
          action: finalDocVerificationStatus === "VERIFIED" ? "VERIFIED" : "FLAGGED",
          entityType: "DOCUMENT",
          entityId: documentId,
          previousValue: JSON.stringify({ trustScore: supplier.trustScore, status: supplier.status }),
          newValue: JSON.stringify({ trustScore: newScore, status: newStatus }),
          source: "ZERO_TRUST_PIPELINE",
          reason: `${calcResult.deterministicAuditLog}. Anomalies: ${
            anomalyFindings.length === 0 ? "None" : anomalyFindings.map((a) => a.whatHappened).join("; ")
          }`,
        },
      });

      return {
        document: updatedDoc,
        shipment,
        calculation: {
          ...calcResult,
          id: calcRecord.id,
        },
        alerts: createdAlerts,
        supplier: {
          ...updatedSupplier,
          score: updatedSupplier.trustScore,
          rating: updatedSupplier.trustScore >= 90 ? "A" : updatedSupplier.trustScore >= 75 ? "B" : updatedSupplier.trustScore >= 60 ? "C" : updatedSupplier.trustScore >= 40 ? "D" : "F",
        },
        auditLog: {
          ...auditEvent,
          entryHash: auditEvent.id,
          prevHash: "0000000000000000",
        },
      };
    });

    return result;
  } else {
    // Certificate pipeline
    const certData = extractedData as CertificateExtraction;
    const isExpired = new Date(certData.expiryDate) < new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedDoc = await tx.document.update({
        where: { id: documentId },
        data: {
          processingStatus: "EXTRACTED",
          verificationStatus: isExpired ? "REJECTED" : "VERIFIED",
          extractedJson: JSON.stringify(certData),
        },
      });

      const cert = await tx.certificate.create({
        data: {
          supplierId: supplier.id,
          documentId,
          number: certData.certNumber,
          type: certData.certType,
          issuer: certData.issuer,
          issueDate: new Date(certData.issueDate),
          expiryDate: new Date(certData.expiryDate),
          status: isExpired ? "EXPIRED" : "ACTIVE",
        },
      });

      const auditEvent = await tx.auditEvent.create({
        data: {
          actor: actorRole,
          action: isExpired ? "REJECTED" : "VERIFIED",
          entityType: "CERTIFICATE",
          entityId: cert.id,
          source: "ZERO_TRUST_PIPELINE",
          reason: `Certificate ${certData.certNumber} registered with status ${cert.status}`,
        },
      });

      return {
        document: updatedDoc,
        certificate: cert,
        shipment: null,
        calculation: null,
        alerts: anomalyFindings,
        supplier,
        auditLog: {
          ...auditEvent,
          entryHash: auditEvent.id,
          prevHash: "0000000000000000",
        },
      };
    });

    return result;
  }
}
