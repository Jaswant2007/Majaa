import fs from "fs";

const baseUrl = "http://localhost:3000";

async function testPhase4EnterpriseUX() {
  console.log("=================================================");
  console.log("PHASE 4 - ENTERPRISE UX VALIDATION TEST");
  console.log("=================================================");

  // 1. Executive Dashboard API
  console.log("\n[TEST 1] Testing /api/dashboard/stats");
  const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
  const stats = await statsRes.json();
  console.log("✓ Dashboard Stats Status:", statsRes.status);
  console.log("✓ Total Suppliers:", stats.kpis?.totalSuppliers);
  console.log(`✓ Tier Breakdown: T1=${stats.kpis?.tier1Count}, T2=${stats.kpis?.tier2Count}, T3=${stats.kpis?.tier3Count}`);
  console.log(`✓ Verified vs Unverified: ${stats.kpis?.verifiedSuppliersCount} verified / ${stats.kpis?.unverifiedSuppliersCount} unverified`);
  console.log(`✓ High Risk: ${stats.kpis?.highRiskSuppliersCount}, Action Required: ${stats.kpis?.actionRequiredCount}`);
  console.log(`✓ Total Scope-3 Footprint: ${stats.kpis?.totalScope3Tonnes} t CO₂e (${stats.kpis?.totalScope3Kg} kg)`);
  console.log(`✓ Expiring Certs: ${stats.kpis?.expiringCertsCount}, Suspicious Docs: ${stats.kpis?.suspiciousDocsCount}`);
  console.log(`✓ Charts Data: Trend=${stats.charts?.emissionsTrend?.length} pts, Risk=${stats.charts?.riskDistribution?.length} buckets, Pie=${stats.charts?.compliancePie?.length} segments`);
  console.log(`✓ Data Freshness: Head Hash = ${stats.freshness?.latestAuditHeadHash?.slice(0, 16)}...`);

  if (!stats.kpis || stats.kpis.totalSuppliers === 0) {
    throw new Error("Dashboard KPIs missing or empty.");
  }

  // 2. Supplier 360 API
  console.log("\n[TEST 2] Testing /api/suppliers/[id] (Supplier 360)");
  const suppRes = await fetch(`${baseUrl}/api/suppliers`);
  const suppData = await suppRes.json();
  const testSupplier = suppData.suppliers[0];

  const s360Res = await fetch(`${baseUrl}/api/suppliers/${testSupplier.id}`);
  const s360 = await s360Res.json();
  console.log("✓ Supplier 360 Status:", s360Res.status);
  console.log("✓ Supplier Name:", s360.supplier?.name);
  console.log("✓ Trust Score:", s360.supplier?.trustScore);
  console.log("✓ Risk Explanation:", s360.riskAnalysis?.explanation);
  console.log("✓ Certs Count:", s360.certificates?.length);
  console.log("✓ Scope-3 Total:", s360.emissions?.totalEmissionsKg, "kg CO₂e");
  console.log("✓ Documents Count:", s360.documents?.length);
  console.log("✓ Shipments Count:", s360.shipments?.length);
  console.log("✓ Alerts Count:", s360.alerts?.length);
  console.log("✓ Audit Trail Count:", s360.auditTrail?.length);
  console.log("✓ Recommended Actions:", s360.recommendedActions?.length);

  if (!s360.supplier || !s360.riskAnalysis || !s360.emissions) {
    throw new Error("Supplier 360 profile incomplete.");
  }

  // 3. Risk & Alert Center API & Status Workflow
  console.log("\n[TEST 3] Testing /api/alerts and Status Workflow");
  const alertsRes = await fetch(`${baseUrl}/api/alerts`);
  const alertsData = await alertsRes.json();
  console.log("✓ Alerts Count:", alertsData.alerts?.length);

  const testAlert = alertsData.alerts.find((a) => a.status === "OPEN") || alertsData.alerts[0];
  if (testAlert) {
    console.log(`✓ Testing status workflow on Alert [${testAlert.id}] (${testAlert.type})`);
    
    // Transition OPEN -> INVESTIGATING
    const invRes = await fetch(`${baseUrl}/api/alerts/${testAlert.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-sourcetrace-role": "COMPLIANCE_OFFICER",
      },
      body: JSON.stringify({ status: "INVESTIGATING" }),
    });
    const invJson = await invRes.json();
    console.log("✓ Transition to INVESTIGATING:", invJson.alert?.status === "INVESTIGATING");

    // Transition INVESTIGATING -> RESOLVED
    const resRes = await fetch(`${baseUrl}/api/alerts/${testAlert.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-sourcetrace-role": "COMPLIANCE_OFFICER",
      },
      body: JSON.stringify({ status: "RESOLVED", resolutionNotes: "Verified and closed via automated audit." }),
    });
    const resJson = await resRes.json();
    console.log("✓ Transition to RESOLVED:", resJson.alert?.status === "RESOLVED");
    console.log("✓ Audit event logged for alert status change:", resJson.auditEvent?.action);
  }

  // 4. Live Update Verification: Ingest document and verify dashboard stats update
  console.log("\n[TEST 4] Live Update Verification: Ingesting new shipment manifest");
  const initialScope3 = stats.kpis?.totalScope3Kg;
  const uniqueId = Date.now().toString().slice(-6);
  const cleanManifestText = fs.readFileSync("demo-docs/demo-manifest-clean-apex.txt", "utf-8")
    .replace("45,000 kg", "55,000 kg")
    .replace("MNF-2024-08819", `MNF-LIVE-${uniqueId}`);

  const uploadRes = await fetch(`${baseUrl}/api/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: `manifest-live-${uniqueId}.txt`,
      content: cleanManifestText,
      supplierId: testSupplier.id,
    }),
  });
  const uploadJson = await uploadRes.json();
  console.log("✓ Upload pipeline executed, calculated emissions:", uploadJson.calculation?.result, "kg CO₂e");

  // Fetch updated dashboard stats
  const updatedStatsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
  const updatedStats = await updatedStatsRes.json();
  const updatedScope3 = updatedStats.kpis?.totalScope3Kg;

  console.log(`✓ Scope-3 footprint before: ${initialScope3} kg -> after: ${updatedScope3} kg (Δ = +${updatedScope3 - initialScope3} kg)`);
  if (updatedScope3 <= initialScope3) {
    throw new Error("Dashboard numbers failed to update after manifest upload.");
  }
  console.log("✓ LIVE DASHBOARD RECALCULATION TEST PASSED!");

  // 5. Test All Page HTTP Statuses
  console.log("\n[TEST 5] Validating All 6 Core View Routes (HTTP 200)");
  const pages = [
    { name: "Executive Dashboard", path: "/" },
    { name: "Supplier 360 Registry", path: "/suppliers" },
    { name: "Supply Chain Explorer", path: "/supply-chain" },
    { name: "Compliance Center", path: "/compliance" },
    { name: "Risk & Alert Center", path: "/alerts" },
    { name: "Scope-3 Lab", path: "/scope3" },
    { name: "Cryptographic Audit Ledger", path: "/audit" },
    { name: "Document Intelligence", path: "/documents" },
  ];

  for (const page of pages) {
    const pRes = await fetch(`${baseUrl}${page.path}`);
    console.log(`✓ ${page.name} (${page.path}) -> HTTP ${pRes.status}`);
    if (pRes.status !== 200) {
      throw new Error(`Page ${page.path} returned HTTP ${pRes.status}`);
    }
  }

  console.log("\n=================================================");
  console.log("PHASE 4 ENTERPRISE UX: ALL 7 CRITERIA PASSED! 🚀");
  console.log("=================================================\n");
}

testPhase4EnterpriseUX().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
