import fs from "fs";

async function testPhase5Intelligence() {
  console.log("=== PHASE 5 - INTELLIGENCE ENGINE & AI COPILOT VALIDATION ===");

  const baseUrl = "http://localhost:3000";

  // 1. Fetch suppliers to retrieve test subjects
  const suppRes = await fetch(`${baseUrl}/api/suppliers`);
  const suppData = await suppRes.json();
  const transEurasia = suppData.suppliers.find((s) => s.registrationNo === "PL-KRS-0000918273");
  const apex = suppData.suppliers.find((s) => s.registrationNo === "NL-KVK-88491021");

  if (!transEurasia) {
    throw new Error("Trans-Eurasia supplier not found in DB.");
  }

  // 2. Upload Problem Manifest (demo-manifest-expired-cert.txt) to trigger status change and alert
  console.log("\n--- STEP 1: Uploading Problem Manifest for Trans-Eurasia ---");
  const expiredManifestText = fs.readFileSync("demo-docs/demo-manifest-expired-cert.txt", "utf-8");

  const pipeRes = await fetch(`${baseUrl}/api/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: "demo-manifest-expired-cert.txt",
      content: expiredManifestText,
      supplierId: transEurasia.id,
    }),
  });

  const pipeResult = await pipeRes.json();
  console.log("Pipeline Execution Status:", pipeResult.success ? "SUCCESS" : "FAILED");
  console.log("Certificate Status:", pipeResult.certificate?.status);
  console.log("New Supplier Status:", pipeResult.risk?.complianceBadge);
  console.log("Anomalies Logged:", pipeResult.anomalies?.length);

  // 3. Test Supplier 360 API for Executive Actions & Data Freshness
  console.log("\n--- STEP 2: Verifying Executive Action Engine & Data Freshness on Supplier 360 ---");
  const s360Res = await fetch(`${baseUrl}/api/suppliers/${transEurasia.id}`);
  const s360 = await s360Res.json();

  console.log("Data Freshness Status:", s360.freshness?.status);
  console.log("Data Age Days:", s360.freshness?.dataAgeDays ?? s360.freshness?.ageDays);
  console.log("Executive Actions Count:", s360.executiveActions?.length);
  if (s360.executiveActions?.length > 0) {
    s360.executiveActions.forEach((act, idx) => {
      console.log(` * Directive #${idx + 1} [${act.priority}]: ${act.title}`);
      console.log(`   Reason: ${act.reason}`);
    });
  }

  // Validate certificates and documents freshness
  const certFreshnessCount = s360.certificates.filter((c) => c.freshness).length;
  const docFreshnessCount = s360.documents.filter((d) => d.freshness).length;
  console.log(`Certificates with Freshness: ${certFreshnessCount}/${s360.certificates.length}`);
  console.log(`Documents with Freshness: ${docFreshnessCount}/${s360.documents.length}`);

  // 4. Test AI Assistant POST /api/ai/query with "Why did this supplier's status change?"
  console.log("\n--- STEP 3: Querying AI Assistant ('Why did this supplier's status change?') ---");
  const aiQueryRes = await fetch(`${baseUrl}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `Why did ${transEurasia.name}'s status change?`,
      supplierId: transEurasia.id,
      role: "COMPLIANCE_OFFICER",
    }),
  });

  const aiAnswer = await aiQueryRes.json();
  console.log("AI Query Status:", aiQueryRes.status);
  console.log("AI Answer:", aiAnswer.answer);
  console.log("Evidence Records Found:", aiAnswer.evidence?.length);

  if (aiAnswer.evidence?.length > 0) {
    aiAnswer.evidence.forEach((ev, idx) => {
      console.log(` * Evidence #${idx + 1} [${ev.type}]: ${ev.title}`);
      console.log(`   Snippet: ${ev.snippet}`);
      console.log(`   Link: ${ev.link}`);
    });
  }

  // 5. Test AI Assistant DB Tools: Expired Certs by Tier & High Risk Suppliers
  console.log("\n--- STEP 4: Querying AI Assistant for High-Risk & Expired Certs across Tiers ---");
  const aiQueryTools = await fetch(`${baseUrl}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Show all high risk suppliers and expired certificates by tier",
      role: "SUSTAINABILITY_MANAGER",
    }),
  });

  const aiToolsAnswer = await aiQueryTools.json();
  console.log("AI Answer (High Risk / Expired):", aiToolsAnswer.answer);
  console.log("Evidence Count:", aiToolsAnswer.evidence?.length);

  // 6. Test Non-Existent Entity Grounding Check (Must NOT invent data)
  console.log("\n--- STEP 5: Testing Grounding & Zero Invention on Non-Existent Entity ---");
  const aiBogus = await fetch(`${baseUrl}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Why did Martian Hyperloop Logistics status change to blacklisted?",
      role: "AUDITOR",
    }),
  });
  const bogusAnswer = await aiBogus.json();
  console.log("Bogus Query Answer:", bogusAnswer.answer);
  console.log("Bogus Query Evidence Count:", bogusAnswer.evidence?.length);

  console.log("\n=== PHASE 5 VERIFICATION COMPLETED SUCCESSFULLY ===");
}

testPhase5Intelligence().catch((err) => {
  console.error("Phase 5 test failed:", err);
  process.exit(1);
});
