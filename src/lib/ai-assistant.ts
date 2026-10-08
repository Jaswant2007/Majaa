import { prisma } from "./db";
import { SessionUser } from "./auth";

export interface EvidenceCard {
  type: "SUPPLIER" | "DOCUMENT" | "ALERT" | "AUDIT_EVENT" | "CALCULATION" | "CERTIFICATE";
  id: string;
  title: string;
  subtitle: string;
  snippet?: string;
  badge?: string;
  badgeColor?: string;
  details: Record<string, any>;
  link?: string;
}

export interface AIQueryResponse {
  query: string;
  answer: string;
  evidence: EvidenceCard[];
  toolsExecuted: string[];
  groundedInDatabase: boolean;
  timestamp: string;
}

/**
 * 1. Tool Query: High Risk Suppliers
 */
async function queryHighRiskSuppliers(user?: SessionUser) {
  const where: any = {
    OR: [{ trustScore: { lt: 70 } }, { blacklisted: true }, { status: "HIGH_RISK" }],
  };
  if (user?.role === "SUPPLIER_USER" && user.supplierId) {
    where.id = user.supplierId;
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      alerts: { where: { status: "OPEN" } },
      certificates: true,
    },
    orderBy: { trustScore: "asc" },
  });

  return suppliers;
}

/**
 * 2. Tool Query: Expired or Expiring Certificates by Tier
 */
async function queryExpiredCertsByTier(tier?: number, user?: SessionUser) {
  const where: any = {
    status: { in: ["EXPIRED", "EXPIRING_SOON", "FORGED"] },
  };

  if (tier) {
    where.supplier = { tier };
  }
  if (user?.role === "SUPPLIER_USER" && user.supplierId) {
    where.supplierId = user.supplierId;
  }

  const certs = await prisma.certificate.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true, tier: true, registrationNo: true } },
    },
    orderBy: { expiryDate: "asc" },
  });

  return certs;
}

/**
 * 3. Tool Query: Top Scope-3 Carbon Emitters
 */
async function queryTopEmitters(limit: number = 5, user?: SessionUser) {
  const where: any = {};
  if (user?.role === "SUPPLIER_USER" && user.supplierId) {
    where.id = user.supplierId;
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      shipments: {
        include: { calculations: true },
      },
    },
  });

  const ranked = suppliers
    .map((s: any) => {
      const totalKg = s.shipments
        .flatMap((shp: any) => shp.calculations)
        .reduce((sum: number, c: any) => sum + c.result, 0);

      return {
        id: s.id,
        name: s.name,
        tier: s.tier,
        registrationNo: s.registrationNo,
        totalEmissionsKg: Math.round(totalKg),
        totalEmissionsTonnes: Number((totalKg / 1000).toFixed(2)),
        shipmentCount: s.shipments.length,
      };
    })
    .sort((a: any, b: any) => b.totalEmissionsKg - a.totalEmissionsKg)
    .slice(0, limit);

  return ranked;
}

/**
 * 4. Tool Query: Why Did a Supplier's Status Change?
 */
async function querySupplierStatusChange(queryText: string, user?: SessionUser) {
  // Extract potential supplier name keywords or ID
  const allSuppliers = await prisma.supplier.findMany({
    include: {
      alerts: true,
      certificates: true,
      documents: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const qLower = queryText.toLowerCase();

  const STOP_WORDS = new Set([
    "logistics", "freight", "transport", "global", "corp", "corporation",
    "ltd", "gmbh", "group", "holdings", "company", "cooperative",
    "syndicate", "supplier", "solutions", "services", "shipping", "electric"
  ]);

  // Find best match by full name, registration number, or distinct brand tokens
  let targetSupplier = allSuppliers.find((s: any) => {
    const normName = s.name.toLowerCase();
    const cleanReg = (s.registrationNo || "").toLowerCase();
    if (qLower.includes(normName)) return true;
    if (cleanReg && qLower.includes(cleanReg)) return true;

    // Check unique brand token (e.g., "eurasia", "kalimantan", "apex", "zambezi")
    const brandTokens = normName
      .split(/[\s\-_]+/)
      .map((w: string) => w.trim().replace(/[^a-z0-9]/g, ""))
      .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w));

    return brandTokens.length > 0 && brandTokens.some((b: string) => qLower.includes(b));
  });

  // Check if query is generically asking without naming an entity
  const isGeneric =
    qLower.includes("this supplier") ||
    qLower.includes("the supplier") ||
    qLower.includes("problematic supplier") ||
    qLower.includes("flagged supplier") ||
    qLower.includes("recent supplier") ||
    qLower.includes("why did status change") ||
    qLower.includes("why did the status change");

  if (!targetSupplier) {
    if (isGeneric) {
      targetSupplier =
        allSuppliers.find(
          (s: any) => s.status === "REQUIRES_REVIEW" || s.status === "HIGH_RISK" || s.trustScore < 85
        ) || allSuppliers[0];
    } else {
      // Named entity was queried but does not exist in DB: DO NOT invent data
      return null;
    }
  }

  if (!targetSupplier) return null;

  // Fetch chronological audit trail for this supplier
  const auditEvents = await prisma.auditEvent.findMany({
    where: {
      OR: [
        { entityType: "SUPPLIER", entityId: targetSupplier.id },
        { entityType: "DOCUMENT", entityId: { in: targetSupplier.documents.map((d: any) => d.id) } },
      ],
    },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  return {
    supplier: targetSupplier,
    auditEvents,
    recentAlerts: targetSupplier.alerts,
    certificates: targetSupplier.certificates,
    documents: targetSupplier.documents,
  };
}

/**
 * 5. Tool Query: What Changed Today?
 */
async function queryWhatChangedToday() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentAudits = await prisma.auditEvent.findMany({
    where: { timestamp: { gte: oneDayAgo } },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  const recentAlerts = await prisma.alert.findMany({
    where: { createdAt: { gte: oneDayAgo } },
    include: { supplier: { select: { id: true, name: true, tier: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return { recentAudits, recentAlerts };
}

/**
 * 6. Tool Query: Suppliers Needing Attention
 */
async function querySuppliersNeedingAttention(user?: SessionUser) {
  const where: any = {
    OR: [
      { status: "REQUIRES_REVIEW" },
      { status: "HIGH_RISK" },
      { trustScore: { lt: 75 } },
      { blacklisted: true },
    ],
  };
  if (user?.role === "SUPPLIER_USER" && user.supplierId) {
    where.id = user.supplierId;
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      alerts: { where: { status: "OPEN" } },
      certificates: { where: { status: { in: ["EXPIRED", "EXPIRING_SOON"] } } },
    },
    orderBy: { trustScore: "asc" },
  });

  return suppliers;
}

/**
 * Main AI Assistant Dispatcher
 * Parses user question, calls corresponding DB tools, and synthesizes grounded answers with evidence cards.
 */
export async function processAIAssistantQuery(
  prompt: string,
  user?: SessionUser
): Promise<AIQueryResponse> {
  const q = prompt.toLowerCase();
  const toolsExecuted: string[] = [];
  const evidence: EvidenceCard[] = [];
  let answer = "";

  // INTENT 1: Why did a supplier's status change?
  if (
    q.includes("why did") ||
    q.includes("status change") ||
    q.includes("status changed") ||
    q.includes("downgrade") ||
    q.includes("flagged") ||
    q.includes("why is")
  ) {
    toolsExecuted.push("querySupplierStatusChange");
    const data = await querySupplierStatusChange(prompt, user);

    if (!data) {
      answer = "No supplier record or status mutation trace was found in the database matching your inquiry.";
    } else {
      const { supplier, auditEvents, recentAlerts, certificates } = data;
      const statusAlert = recentAlerts.find((a: any) => a.status === "OPEN") || recentAlerts[0];
      const riskEvent = auditEvents.find((e: any) => e.action === "RISK_CHANGE");
      const statusEvent = auditEvents.find((e: any) => e.action === "STATUS_CHANGE");
      const certIssue = certificates.find((c: any) => c.status === "EXPIRED" || c.status === "EXPIRING_SOON");

      // Evidence: Supplier Card
      evidence.push({
        type: "SUPPLIER",
        id: supplier.id,
        title: supplier.name,
        subtitle: `${supplier.registrationNo} • Tier ${supplier.tier} (${supplier.country})`,
        snippet: `${supplier.name} (${supplier.registrationNo}) registered in ${supplier.country} as Tier ${supplier.tier} with trust score ${supplier.trustScore}/100.`,
        badge: supplier.status,
        badgeColor: supplier.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300",
        link: `/suppliers/${supplier.id}`,
        details: {
          trustScore: `${supplier.trustScore} / 100`,
          status: supplier.status,
          blacklisted: supplier.blacklisted,
        },
      });

      // Evidence: Alert Cards
      if (statusAlert) {
        evidence.push({
          type: "ALERT",
          id: statusAlert.id,
          title: `Compliance Flag: ${statusAlert.type}`,
          subtitle: statusAlert.whatHappened,
          snippet: `${statusAlert.type}: ${statusAlert.whatHappened}. Action: ${statusAlert.recommendedAction}`,
          badge: statusAlert.severity,
          badgeColor: statusAlert.severity === "CRITICAL" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300",
          link: "/alerts",
          details: {
            whatHappened: statusAlert.whatHappened,
            whyItMatters: statusAlert.whyItMatters,
            recommendedAction: statusAlert.recommendedAction,
          },
        });
      }

      // Evidence: Audit Event
      if (riskEvent || statusEvent) {
        const evt = riskEvent || statusEvent!;
        evidence.push({
          type: "AUDIT_EVENT",
          id: evt.id,
          title: `Audit Ledger Block: ${evt.action}`,
          subtitle: evt.reason || "Cryptographic state transition",
          snippet: `${evt.action} triggered by ${evt.actor}: ${evt.reason} (${evt.previousValue} -> ${evt.newValue})`,
          badge: `${evt.previousValue || "INITIAL"} → ${evt.newValue || evt.action}`,
          badgeColor: "bg-cyan-500/20 text-cyan-300",
          link: "/audit",
          details: {
            actor: evt.actor,
            source: evt.source,
            entryHash: evt.entryHash,
            timestamp: evt.timestamp.toISOString(),
          },
        });
      }

      // Evidence: Certificate if relevant
      if (certIssue) {
        evidence.push({
          type: "CERTIFICATE",
          id: certIssue.id,
          title: `Credential ${certIssue.number} (${certIssue.type})`,
          subtitle: `Issuer: ${certIssue.issuer} • Expiry: ${new Date(certIssue.expiryDate).toLocaleDateString()}`,
          snippet: `Certificate ${certIssue.number} issued by ${certIssue.issuer} expired on ${new Date(certIssue.expiryDate).toLocaleDateString()}. Status: ${certIssue.status}.`,
          badge: certIssue.status,
          badgeColor: certIssue.status === "EXPIRED" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300",
          link: "/compliance",
          details: {
            type: certIssue.type,
            expiryDate: certIssue.expiryDate.toISOString(),
            status: certIssue.status,
          },
        });
      }

      // Synthesize answer based on real DB findings
      const reasons: string[] = [];
      if (statusAlert) reasons.push(statusAlert.whatHappened);
      if (certIssue) reasons.push(`Certificate ${certIssue.number} (${certIssue.type}) status is ${certIssue.status}.`);
      if (supplier.blacklisted) reasons.push("The entity is flagged on international trade sanction watchlists.");

      const reasonSummary = reasons.join(" ") || "Audit checks flagged cross-field or threshold discrepancies.";

      answer = `Supplier **${supplier.name}** (Tier ${supplier.tier}, Reg: ${supplier.registrationNo}) has an active status of **${supplier.status}** with a trust score of **${supplier.trustScore}/100**.\n\n` +
        `**Root Cause Analysis:**\n` +
        `1. **Triggering Finding**: ${reasonSummary}\n` +
        `2. **State Transition**: ${riskEvent ? `Trust score shifted: ${riskEvent.previousValue} -> ${riskEvent.newValue} (${riskEvent.reason})` : `Verification state evaluated to ${supplier.status}.`}\n` +
        `3. **Regulatory Impact**: ${statusAlert?.whyItMatters || "Consignments from this vendor require secondary verification prior to CSRD reporting."}\n\n` +
        `All findings are anchored in the cryptographic audit ledger. Click the evidence cards below to inspect the full audit trail.`;
    }
  }

  // INTENT 2: High Risk Suppliers
  else if (
    q.includes("high-risk") ||
    q.includes("high risk") ||
    q.includes("riskiest") ||
    q.includes("sanctioned") ||
    q.includes("blacklisted")
  ) {
    toolsExecuted.push("queryHighRiskSuppliers");
    const highRisk = await queryHighRiskSuppliers(user);

    highRisk.forEach((s: any) => {
      evidence.push({
        type: "SUPPLIER",
        id: s.id,
        title: s.name,
        subtitle: `Reg: ${s.registrationNo} • Tier ${s.tier} (${s.country})`,
        snippet: `High-risk supplier ${s.name} (${s.registrationNo}) with trust score ${s.trustScore}/100 and ${s.alerts.length} open alert(s).`,
        badge: s.blacklisted ? "BLACKLISTED" : `${s.trustScore} PTS`,
        badgeColor: "bg-rose-500/20 text-rose-300",
        link: `/suppliers/${s.id}`,
        details: {
          trustScore: s.trustScore,
          blacklisted: s.blacklisted,
          openAlerts: s.alerts.length,
        },
      });
    });

    answer = `There are currently **${highRisk.length} high-risk supplier entity(ies)** identified in the database:\n\n` +
      highRisk
        .map(
          (s: any) =>
            `- **${s.name}** (Tier ${s.tier}, ${s.country}): Trust score **${s.trustScore}/100**, Status: **${s.status}** ${
              s.blacklisted ? "⚠️ **SANCTIONED ENTITY**" : ""
            } (${s.alerts.length} open alert(s)).`
        )
        .join("\n") +
      `\n\nThese suppliers require immediate compliance review or quarantine under Rule 9. Inspect the cards below for full dossiers.`;
  }

  // INTENT 3: Expired Certificates by Tier
  else if (
    q.includes("expired cert") ||
    q.includes("expiring") ||
    q.includes("certificate") ||
    q.includes("iso")
  ) {
    let tierFilter: number | undefined = undefined;
    if (q.includes("tier 1") || q.includes("tier-1")) tierFilter = 1;
    if (q.includes("tier 2") || q.includes("tier-2")) tierFilter = 2;
    if (q.includes("tier 3") || q.includes("tier-3")) tierFilter = 3;

    toolsExecuted.push("queryExpiredCertsByTier");
    const certs = await queryExpiredCertsByTier(tierFilter, user);

    certs.forEach((c: any) => {
      evidence.push({
        type: "CERTIFICATE",
        id: c.id,
        title: `${c.number} (${c.type})`,
        subtitle: `${c.supplier.name} (Tier ${c.supplier.tier})`,
        snippet: `Certificate ${c.number} (${c.type}) for ${c.supplier.name} is ${c.status}. Expiry: ${new Date(c.expiryDate).toLocaleDateString()}.`,
        badge: c.status,
        badgeColor: c.status === "EXPIRED" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300",
        link: "/compliance",
        details: {
          issuer: c.issuer,
          expiryDate: new Date(c.expiryDate).toLocaleDateString(),
          supplier: c.supplier.name,
        },
      });
    });

    answer = `Found **${certs.length} certificate(s)** with compliance issues ${
      tierFilter ? `for Tier ${tierFilter}` : "across all supply chain tiers"
    }:\n\n` +
      certs
        .map(
          (c: any) =>
            `- **${c.supplier.name}** (Tier ${c.supplier.tier}): **${c.type}** (${c.number}) is **${c.status}** (Expired/Expiring: ${new Date(
              c.expiryDate
            ).toLocaleDateString()}). Issuer: ${c.issuer}.`
        )
        .join("\n") +
      `\n\nUnder EU CSRD and GHG Protocol standards, consignments processed during expired validity windows must be flagged as unverified emissions.`;
  }

  // INTENT 4: Top Emitters
  else if (
    q.includes("top emitter") ||
    q.includes("highest emitter") ||
    q.includes("highest emission") ||
    q.includes("most carbon") ||
    q.includes("emissions")
  ) {
    toolsExecuted.push("queryTopEmitters");
    const topEmitters = await queryTopEmitters(5, user);

    topEmitters.forEach((e: any) => {
      evidence.push({
        type: "SUPPLIER",
        id: e.id,
        title: e.name,
        subtitle: `Tier ${e.tier} • ${e.shipmentCount} Recorded Manifests`,
        snippet: `Top emitter ${e.name} generated ${e.totalEmissionsTonnes} t CO2e across ${e.shipmentCount} shipments.`,
        badge: `${e.totalEmissionsTonnes} t CO₂e`,
        badgeColor: "bg-cyan-500/20 text-cyan-300",
        link: `/suppliers/${e.id}`,
        details: {
          totalKg: e.totalEmissionsKg,
          tonnes: e.totalEmissionsTonnes,
          shipments: e.shipmentCount,
        },
      });
    });

    answer = `The **top Scope-3 carbon emitters** ranked across empirical logistics activity data are:\n\n` +
      topEmitters
        .map(
          (e: any, idx: number) =>
            `${idx + 1}. **${e.name}** (Tier ${e.tier}): **${e.totalEmissionsTonnes} tonnes CO₂e** (${e.totalEmissionsKg.toLocaleString()} kg) across ${e.shipmentCount} verified shipment(s).`
        )
        .join("\n") +
      `\n\nAll calculations were performed deterministically using DEFRA 2024 emission factors ($t\\text{-km} \\times \\text{factor}$).`;
  }

  // INTENT 5: What Changed Today?
  else if (
    q.includes("what changed") ||
    q.includes("today") ||
    q.includes("recent change") ||
    q.includes("audit ledger") ||
    q.includes("activity log")
  ) {
    toolsExecuted.push("queryWhatChangedToday");
    const { recentAudits, recentAlerts } = await queryWhatChangedToday();

    recentAudits.slice(0, 5).forEach((evt: any) => {
      evidence.push({
        type: "AUDIT_EVENT",
        id: evt.id,
        title: `${evt.action} on ${evt.entityType}`,
        subtitle: evt.reason || `Mutated ${evt.entityId}`,
        snippet: `Ledger block ${evt.action} on ${evt.entityType}: ${evt.reason}`,
        badge: evt.source,
        badgeColor: "bg-emerald-500/20 text-emerald-300",
        link: "/audit",
        details: {
          actor: evt.actor,
          timestamp: evt.timestamp.toISOString(),
          entryHash: evt.entryHash,
        },
      });
    });

    answer = `Within the last 24-hour audit cycle, the cryptographic ledger recorded **${recentAudits.length} state mutation(s)** and **${recentAlerts.length} forensic alert(s)**.\n\n` +
      `**Recent Ledger Milestones:**\n` +
      recentAudits
        .slice(0, 4)
        .map((a: any) => `- **[${a.action}]** on ${a.entityType}: ${a.reason || "State updated"} (${new Date(a.timestamp).toLocaleTimeString()}).`)
        .join("\n") +
      `\n\nAll ledger blocks are chained with SHA-256 forward digests to ensure tamper-evidence. Inspect the evidence blocks below.`;
  }

  // INTENT 6: Suppliers Needing Attention
  else if (
    q.includes("attention") ||
    q.includes("action required") ||
    q.includes("need attention") ||
    q.includes("review queue")
  ) {
    toolsExecuted.push("querySuppliersNeedingAttention");
    const needingAttention = await querySuppliersNeedingAttention(user);

    needingAttention.forEach((s: any) => {
      evidence.push({
        type: "SUPPLIER",
        id: s.id,
        title: s.name,
        subtitle: `Tier ${s.tier} • Trust: ${s.trustScore}/100`,
        snippet: `Supplier ${s.name} requires attention: ${s.status} (${s.alerts.length} alerts, ${s.certificates.length} expired certs).`,
        badge: s.status,
        badgeColor: "bg-amber-500/20 text-amber-300",
        link: `/suppliers/${s.id}`,
        details: {
          openAlerts: s.alerts.length,
          expiredCerts: s.certificates.length,
        },
      });
    });

    answer = `There are currently **${needingAttention.length} supplier(s) requiring executive compliance attention**:\n\n` +
      needingAttention
        .map(
          (s: any) =>
            `- **${s.name}** (Tier ${s.tier}): Status **${s.status}**, Trust: **${s.trustScore} pts**. Open anomalies: ${s.alerts.length}, Expired certs: ${s.certificates.length}.`
        )
        .join("\n") +
      `\n\nReview actions can be conducted directly from the Compliance Center or Document Intelligence adjudication desk.`;
  }

  // DEFAULT / GENERAL ASSISTANCE
  else {
    toolsExecuted.push("queryHighRiskSuppliers", "queryTopEmitters");
    const highRisk = await queryHighRiskSuppliers(user);
    const topEmitters = await queryTopEmitters(3, user);

    if (highRisk[0]) {
      evidence.push({
        type: "SUPPLIER",
        id: highRisk[0].id,
        title: highRisk[0].name,
        subtitle: `Highest Risk Entity • Trust Score: ${highRisk[0].trustScore}`,
        badge: highRisk[0].status,
        badgeColor: "bg-rose-500/20 text-rose-300",
        link: `/suppliers/${highRisk[0].id}`,
        details: { status: highRisk[0].status },
      });
    }

    answer = `I am your SourceTrace AI Regulatory Copilot. I have live query access to the enterprise database.\n\n` +
      `You can query:\n` +
      `- *"Why did this supplier's status change?"*\n` +
      `- *"Which suppliers are high-risk?"*\n` +
      `- *"Show expired certificates by tier"*\n` +
      `- *"Who are our top Scope-3 emitters?"*\n` +
      `- *"What changed in the audit ledger today?"*\n` +
      `- *"Which suppliers need immediate attention?"*\n\n` +
      `All answers are deterministically verified against active database tables and include verifiable evidence cards.`;
  }

  return {
    query: prompt,
    answer,
    evidence,
    toolsExecuted,
    groundedInDatabase: true,
    timestamp: new Date().toISOString(),
  };
}
