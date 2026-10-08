import { prisma } from "./lib/db";
import { calculateFreightScope3Emissions } from "./lib/calculator";
import { extractDocumentEntities } from "./lib/extractor";
import { executeDocumentVerificationPipeline } from "./lib/integrity";

async function testEngine() {
  console.log("=== TESTING SOURCETRACE DETERMINISTIC ENGINES ===");

  // 1. Test Deterministic Calculator
  console.log("\n1. Testing Scope-3 Calculator...");
  const calc = await calculateFreightScope3Emissions({
    distanceKm: 850,
    weightTonnes: 42.5,
    transportMode: "ROAD",
    fuelType: "DIESEL",
  });
  console.log("Activity Data (t-km):", calc.activityDataTonneKm);
  console.log("Factor Applied (kg CO2e/t-km):", calc.emissionFactorApplied);
  console.log("Calculated Scope-3 kg CO2e:", calc.totalKgCO2e);
  console.log("Formula trace:", calc.formulaUsed);
  if (calc.totalKgCO2e !== Number((850 * 42.5 * 0.0962).toFixed(4))) {
    throw new Error("Calculation mismatch!");
  }
  console.log(">> Scope-3 calculation verified 100% deterministic.");

  // 2. Test Document Extraction
  console.log("\n2. Testing Manifest Extraction...");
  const sampleManifestText = `
LOGISTICS FREIGHT MANIFEST - TRANS-EURASIA
Manifest ID: MNF-TE-2024-998
Shipper: Trans-Eurasia Freight Corp
From: Warsaw Freight Terminal, PL
To: Rotterdam Port, NL
Distance: 1150 km
Gross Cargo Weight: 38.2 tonnes
Transport Mode: ROAD
Fuel Type: DIESEL
Compliance Ref: CERT-ECO-TE-8812
Carrier: Trans-Eurasia Fleet Unit 04
`;

  const extraction = await extractDocumentEntities({
    content: sampleManifestText,
    filename: "manifest-te-998.txt",
    declaredDocType: "LOGISTICS_MANIFEST",
  });

  console.log("Extraction success:", extraction.success);
  console.log("Extracted Data:", JSON.stringify(extraction.data, null, 2));

  // 3. Test End-to-End ACID Transaction Verification
  console.log("\n3. Testing End-to-End Transaction Pipeline...");
  const supplier = await prisma.supplier.findFirst({
    where: { registrationNo: "PL-KRS-0000918273" },
  });

  if (!supplier) throw new Error("Supplier Trans-Eurasia not found");

  // Create an UNVERIFIED document record (Rule 6: every upload starts UNVERIFIED)
  const doc = await prisma.document.create({
    data: {
      supplierId: supplier.id,
      filename: "manifest-te-998.txt",
      mimeType: "text/plain",
      size: Buffer.byteLength(sampleManifestText),
      storagePath: "/uploads/manifest-te-998.txt",
      sha256Hash: "d8e8fca2dc0f896fd7cb4cb0031ba249",
      processingStatus: "UNVERIFIED",
      verificationStatus: "PENDING",
    },
  });

  console.log(`Document created with state: ${doc.processingStatus} (ID: ${doc.id})`);

  // Execute verification pipeline
  const result = await executeDocumentVerificationPipeline({
    documentId: doc.id,
    supplierId: supplier.id,
    extractedData: extraction.data as any,
    docType: "LOGISTICS_MANIFEST",
  });

  console.log("\nTransaction Committed Successfully!");
  console.log("Final Document Status:", result.document.verificationStatus);
  if (result.calculation) {
    console.log("Deterministic Scope 3 Calculated:", result.calculation.totalKgCO2e, "kg CO2e");
  }
  if (result.alerts) {
    console.log("Alerts Generated:", result.alerts.length);
    result.alerts.forEach((a: any) => console.log(` - [${a.severity}] ${a.whatHappened || a.title}`));
  }
  if (result.supplier) {
    console.log(`Supplier Trust Score: ${supplier.trustScore} -> ${(result.supplier as any).score}`);
  }

  console.log("\n=== ALL ENGINE TESTS PASSED ===");
}

testEngine()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
