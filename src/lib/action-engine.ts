export interface ExecutiveAction {
  id: string;
  type:
    | "REQUEST_RENEWED_CERTIFICATE"
    | "INVESTIGATE_DOCUMENT"
    | "REQUEST_CORRECTION"
    | "ESCALATE_SUPPLIER"
    | "INVESTIGATE_EMISSION_ANOMALY"
    | "REFRESH_ACTIVITY_DATA";
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  suggestedWorkflow: string;
  entityType: "SUPPLIER" | "DOCUMENT" | "CERTIFICATE" | "SHIPMENT" | "ALERT";
  entityId: string;
}

/**
 * Rule-Based Executive Action Engine
 * Synthesizes deterministic compliance anomalies into actionable governance directives (Rule 9).
 */
export function generateExecutiveActions(params: {
  supplier: any;
  certificates?: any[];
  documents?: any[];
  alerts?: any[];
  emissions?: any;
}): ExecutiveAction[] {
  const actions: ExecutiveAction[] = [];
  const { supplier, certificates = [], documents = [], alerts = [] } = params;

  // 1. Sanctions & Blacklist Check -> ESCALATE_SUPPLIER (CRITICAL)
  if (supplier.blacklisted || supplier.status === "BLACKLISTED") {
    actions.push({
      id: `act-esc-${supplier.id}`,
      type: "ESCALATE_SUPPLIER",
      title: "Escalate Immediate Supplier Quarantine",
      priority: "CRITICAL",
      reason: "Entity is listed on international sanctions list or designated high-risk trade watchlist.",
      suggestedWorkflow: "Quarantine consignment clearance, halt purchase order settlement, and notify Chief Compliance Officer.",
      entityType: "SUPPLIER",
      entityId: supplier.id,
    });
  }

  // 2. Identity Mismatches -> REQUEST_CORRECTION (HIGH)
  const idAlert = alerts.find(
    (a) => a.type === "IDENTITY_MISMATCH" && a.status !== "RESOLVED"
  );
  if (idAlert) {
    actions.push({
      id: `act-id-${supplier.id}`,
      type: "REQUEST_CORRECTION",
      title: "Request Legal Identity & Registration Correction",
      priority: "HIGH",
      reason: idAlert.whatHappened || "Manifest declares vendor legal name or tax ID distinct from enterprise registry.",
      suggestedWorkflow: "Demand verified bill of lading chain-of-custody and notarized certificate of incorporation within 5 business days.",
      entityType: "SUPPLIER",
      entityId: supplier.id,
    });
  }

  // 3. Expired Certificates -> REQUEST_RENEWED_CERTIFICATE (HIGH)
  const expiredCerts = certificates.filter((c) => c.status === "EXPIRED");
  if (expiredCerts.length > 0) {
    actions.push({
      id: `act-cert-exp-${supplier.id}`,
      type: "REQUEST_RENEWED_CERTIFICATE",
      title: "Request Renewed Environmental Credential",
      priority: "HIGH",
      reason: `${expiredCerts.length} accreditation(s) (${expiredCerts.map((c) => c.type).join(", ")}) have expired, disqualifying freight emissions from CSRD assurance.`,
      suggestedWorkflow: "Issue formal audit notice demanding valid ISO-14064 or equivalent recertification document.",
      entityType: "CERTIFICATE",
      entityId: expiredCerts[0].id || supplier.id,
    });
  }

  // 4. Expiring Soon Certificates -> REQUEST_RENEWED_CERTIFICATE (MEDIUM)
  const expiringSoon = certificates.filter((c) => c.status === "EXPIRING_SOON");
  if (expiringSoon.length > 0) {
    actions.push({
      id: `act-cert-soon-${supplier.id}`,
      type: "REQUEST_RENEWED_CERTIFICATE",
      title: "Initiate Advance Certificate Renewal",
      priority: "MEDIUM",
      reason: `Certificate ${expiringSoon[0].number} expires within 30 days. Advance renewal required to prevent compliance interruption.`,
      suggestedWorkflow: "Send automated portal prompt to supplier compliance desk requesting renewal filing.",
      entityType: "CERTIFICATE",
      entityId: expiringSoon[0].id || supplier.id,
    });
  }

  // 5. Suspicious / Flagged Documents -> INVESTIGATE_DOCUMENT (HIGH/MEDIUM)
  const unverifiedDocs = documents.filter(
    (d) => d.verificationStatus === "REQUIRES_REVIEW" || d.verificationStatus === "REJECTED"
  );
  if (unverifiedDocs.length > 0) {
    actions.push({
      id: `act-doc-${unverifiedDocs[0].id}`,
      type: "INVESTIGATE_DOCUMENT",
      title: "Investigate Flagged Ingestion Manifest",
      priority: "HIGH",
      reason: `Document ${unverifiedDocs[0].filename} held in ${unverifiedDocs[0].verificationStatus} status due to integrity anomalies.`,
      suggestedWorkflow: "Open Document Intelligence view, inspect low-confidence fields and validation notes, and perform manual review.",
      entityType: "DOCUMENT",
      entityId: unverifiedDocs[0].id,
    });
  }

  // 6. High Emissions Alert -> INVESTIGATE_EMISSION_ANOMALY (HIGH)
  const emissionAlert = alerts.find(
    (a) => a.type === "HIGH_EMISSIONS" && a.status !== "RESOLVED"
  );
  if (emissionAlert) {
    actions.push({
      id: `act-emiss-${supplier.id}`,
      type: "INVESTIGATE_EMISSION_ANOMALY",
      title: "Audit Freight Route & Fuel Anomaly",
      priority: "HIGH",
      reason: emissionAlert.whatHappened || "Reported transport intensity exceeds verified DEFRA baseline benchmark by >100%.",
      suggestedWorkflow: "Audit telemetry telematics logs, verify intermodal rail vs road distribution, and engage sustainability engineering team.",
      entityType: "ALERT",
      entityId: emissionAlert.id || supplier.id,
    });
  }

  // 7. Stale Activity Data -> REFRESH_ACTIVITY_DATA (MEDIUM)
  if (supplier.daysSinceAudit > 90 || supplier.isStale) {
    actions.push({
      id: `act-stale-${supplier.id}`,
      type: "REFRESH_ACTIVITY_DATA",
      title: "Request Updated Primary Activity Disclosure",
      priority: "MEDIUM",
      reason: `Last verified activity data is ${supplier.daysSinceAudit} days old (>90 days). EU CSRD requires active annual empirical evidence.`,
      suggestedWorkflow: "Send disclosure invitation to vendor portal requesting Q3 logistics manifest filings.",
      entityType: "SUPPLIER",
      entityId: supplier.id,
    });
  }

  // Fallback: If completely compliant, standard quarterly monitoring
  if (actions.length === 0) {
    actions.push({
      id: `act-ok-${supplier.id}`,
      type: "REFRESH_ACTIVITY_DATA",
      title: "Maintain Standard Audit Cadence",
      priority: "LOW",
      reason: "All environmental accreditations, identity checks, and logistics disclosures are fully verified.",
      suggestedWorkflow: "Schedule next standard quarterly telemetry refresh.",
      entityType: "SUPPLIER",
      entityId: supplier.id,
    });
  }

  return actions;
}
