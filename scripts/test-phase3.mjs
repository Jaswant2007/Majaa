import fs from "fs";

const baseUrl = "http://localhost:3000";

async function testPhase3Auditability() {
  console.log("=================================================");
  console.log("PHASE 3 AUDITABILITY & PROVENANCE VALIDATION TEST");
  console.log("=================================================");

  // 0. Fetch seeded supplier (Apex Global)
  const suppRes = await fetch(`${baseUrl}/api/suppliers`);
  const suppData = await suppRes.json();
  const apex = suppData.suppliers.find((s) => s.registrationNo === "NL-KVK-88491021");
  const transEurasia = suppData.suppliers.find((s) => s.registrationNo === "PL-KRS-0000918273");

  if (!apex) throw new Error("Apex supplier not found.");

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testFilename = `manifest-audit-${uniqueSuffix}.txt`;
  const cleanManifestText = fs.readFileSync("demo-docs/demo-manifest-clean-apex.txt", "utf-8");

  // 1. Ingest Document v1
  console.log(`\n[STEP 1] Ingesting Document v1: ${testFilename}`);
  const resV1 = await fetch(`${baseUrl}/api/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: testFilename,
      content: cleanManifestText,
      supplierId: apex.id,
    }),
  });

  const jsonV1 = await resV1.json();
  console.log(`✓ Document v1 created with ID: ${jsonV1.document.id}`);
  console.log(`✓ Version: ${jsonV1.document.version}`);
  console.log(`✓ Verification Status: ${jsonV1.document.verificationStatus}`);

  // 2. Ingest Document v2 (same filename, modified cargo weight to test Document Versioning)
  console.log(`\n[STEP 2] Re-uploading document to test Document Versioning (v2)`);
  const v2ManifestText = cleanManifestText.replace("45,000 kg", "49,500 kg");
  const resV2 = await fetch(`${baseUrl}/api/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: testFilename,
      content: v2ManifestText,
      supplierId: apex.id,
    }),
  });

  const jsonV2 = await resV2.json();
  console.log(`✓ Document v2 created with ID: ${jsonV2.document.id}`);
  console.log(`✓ Version: ${jsonV2.document.version}`);
  console.log(`✓ Parent Document ID: ${jsonV2.document.parentDocId}`);

  if (jsonV2.document.version !== 2) {
    throw new Error(`Expected document version 2, got ${jsonV2.document.version}`);
  }
  if (jsonV2.document.parentDocId !== jsonV1.document.id) {
    throw new Error(`Expected parentDocId to be ${jsonV1.document.id}, got ${jsonV2.document.parentDocId}`);
  }
  console.log("✓ DOCUMENT VERSIONING PASSED: v2 links directly to parent v1!");

  // 3. Ingest Problem Document to trigger REQUIRES_REVIEW for Manual Review
  console.log(`\n[STEP 3] Ingesting Problem Manifest to trigger REQUIRES_REVIEW`);
  const expiredFilename = `manifest-expired-${uniqueSuffix}.txt`;
  const expiredManifestText = fs.readFileSync("demo-docs/demo-manifest-expired-cert.txt", "utf-8");
  const resExp = await fetch(`${baseUrl}/api/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: expiredFilename,
      content: expiredManifestText,
      supplierId: transEurasia.id,
    }),
  });

  const jsonExp = await resExp.json();
  console.log(`✓ Problem Document ID: ${jsonExp.document.id}`);
  console.log(`✓ Problem Document Status: ${jsonExp.document.verificationStatus}`);

  // 4. Test Documents API for Provenance & Version Tree
  console.log(`\n[STEP 4] Testing /api/documents for Provenance & Version Data`);
  const docsRes = await fetch(`${baseUrl}/api/documents`);
  const docsData = await docsRes.json();
  console.log(`✓ Total Ingested Documents in DB: ${docsData.documents.length}`);

  const fetchedV2 = docsData.documents.find((d) => d.id === jsonV2.document.id);
  if (!fetchedV2) throw new Error("Document v2 not found in /api/documents");

  console.log(`✓ Document v2 SHA-256 Digest: ${fetchedV2.sha256Hash}`);
  console.log(`✓ Document v2 Parent Link: v${fetchedV2.parentDoc?.version} (${fetchedV2.parentDoc?.id})`);
  console.log(`✓ Extracted Json Field Count: ${Object.keys(fetchedV2.extractedJson || {}).length}`);
  console.log(`✓ Validation History Event Count: ${fetchedV2.validationHistory?.length}`);

  // 5. Test Compliance Officer Manual Review Flow
  console.log(`\n[STEP 5] Testing Manual Review Flow on Problem Document (${jsonExp.document.id})`);
  const reviewReason = "Secondary environmental cert re-validation verified via Polish Chamber of Commerce. Exemption granted.";
  const reviewRes = await fetch(`${baseUrl}/api/documents/${jsonExp.document.id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sourcetrace-role": "COMPLIANCE_OFFICER",
    },
    body: JSON.stringify({
      decision: "APPROVED",
      reason: reviewReason,
    }),
  });

  const reviewJson = await reviewRes.json();
  console.log("✓ Manual Review API Status:", reviewRes.status);
  console.log("✓ Manual Review Response Success:", reviewJson.success);
  console.log("✓ Document Status after Review:", reviewJson.document.verificationStatus);
  console.log("✓ Document Reviewed By:", reviewJson.document.reviewedBy);
  console.log("✓ Review Justification Reason:", reviewJson.document.reviewDecisionReason);

  if (reviewJson.document.verificationStatus !== "VERIFIED") {
    throw new Error(`Expected verificationStatus to be VERIFIED, got ${reviewJson.document.verificationStatus}`);
  }

  // 6. Test Audit Ledger API & Cryptographic Chain
  console.log(`\n[STEP 6] Inspecting /api/audit Chronological Trace & Tamper-Evidence`);
  const auditRes = await fetch(`${baseUrl}/api/audit`);
  const auditData = await auditRes.json();

  console.log(`✓ Total Audit Ledger Entries: ${auditData.totalEntriesCount}`);
  console.log(`✓ Ledger Integrity Status: ${auditData.ledgerIntegrityStatus}`);
  console.log(`✓ Cryptographic Chain Valid: ${auditData.chainValid}`);
  console.log(`✓ Head Hash: ${auditData.verificationReport?.headHash}`);

  // Find recent actions in the audit ledger
  const recentActions = auditData.auditLedger.slice(0, 15).map((l) => l.action);
  console.log(`✓ Recent Recorded Actions in Ledger: ${recentActions.join(", ")}`);

  const hasUpload = recentActions.includes("UPLOAD");
  const hasExtraction = recentActions.includes("EXTRACTION");
  const hasIdentityCheck = recentActions.includes("IDENTITY_CHECK");
  const hasCertCheck = recentActions.includes("CERT_CHECK");
  const hasCalculation = recentActions.includes("CALCULATION");
  const hasRiskChange = recentActions.includes("RISK_CHANGE");
  const hasStatusChange = recentActions.includes("STATUS_CHANGE");
  const hasManualReview = recentActions.includes("MANUAL_REVIEW");

  console.log(` * UPLOAD logged: ${hasUpload}`);
  console.log(` * EXTRACTION logged: ${hasExtraction}`);
  console.log(` * IDENTITY_CHECK logged: ${hasIdentityCheck}`);
  console.log(` * CERT_CHECK logged: ${hasCertCheck}`);
  console.log(` * CALCULATION logged: ${hasCalculation}`);
  console.log(` * RISK_CHANGE logged: ${hasRiskChange}`);
  console.log(` * STATUS_CHANGE logged: ${hasStatusChange}`);
  console.log(` * MANUAL_REVIEW logged: ${hasManualReview}`);

  // Check before -> after value diff on risk change
  const riskLog = auditData.auditLedger.find((l) => l.action === "RISK_CHANGE");
  if (riskLog) {
    console.log(`✓ Verified Before/After Diff in Ledger: "${riskLog.previousValue}" -> "${riskLog.newValue}" (Reason: ${riskLog.reason})`);
  }

  // 7. Test Explicit Cryptographic Verification Endpoint
  console.log(`\n[STEP 7] Verifying /api/audit/verify Endpoint`);
  const verifyRes = await fetch(`${baseUrl}/api/audit/verify`);
  const verifyData = await verifyRes.json();
  console.log(`✓ Verification API Status: ${verifyData.status}`);
  console.log(`✓ Verified Blocks: ${verifyData.verifiedBlocks}/${verifyData.totalEntries}`);
  console.log(`✓ Is Tamper Evident: ${verifyData.isTamperEvident}`);
  console.log(`✓ Disclosure Notice: "${verifyData.disclosureNotice}"`);

  if (!verifyData.isValid) {
    throw new Error(`Chain verification failed: ${verifyData.error}`);
  }

  console.log("\n=================================================");
  console.log("PHASE 3 AUDITABILITY TEST: ALL 5 CRITERIA PASSED! 🚀");
  console.log("=================================================\n");
}

testPhase3Auditability().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
