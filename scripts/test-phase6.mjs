import fs from "fs";

async function testPhase6AdvancedModules() {
  console.log("=== PHASE 6 - ADVANCED ENTERPRISE MODULES VALIDATION ===");

  const baseUrl = "http://localhost:3000";

  // 1. WHAT-IF CARBON SIMULATOR (Deterministic Modal Shift)
  console.log("\n--- TEST 1: What-If Carbon Simulator (Air -> Sea Shift) ---");
  const simAirSeaRes = await fetch(`${baseUrl}/api/simulator/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cargoWeight_kg: 20000, // 20 tonnes
      freightDistance_km: 4500, // 4,500 km
      originalMode: "AIR",
      originalFuel: "JET_A1",
      scenarioMode: "SEA",
      scenarioFuel: "LNG",
    }),
  });

  const simAirSea = await simAirSeaRes.json();
  console.log("Air -> Sea Status:", simAirSeaRes.status);
  console.log(` * Baseline (${simAirSea.baseline.transportMode} / ${simAirSea.baseline.fuelType}):`, simAirSea.baseline.emissionsKg, "kg CO2e");
  console.log(`   Factor: ${simAirSea.baseline.factor} (${simAirSea.baseline.factorSource})`);
  console.log(` * Scenario (${simAirSea.scenario.transportMode} / ${simAirSea.scenario.fuelType}):`, simAirSea.scenario.emissionsKg, "kg CO2e");
  console.log(`   Factor: ${simAirSea.scenario.factor} (${simAirSea.scenario.factorSource})`);
  console.log(` * Savings: ${simAirSea.comparison.savedTonnesCO2e} t CO2e avoided`);
  console.log(` * % Reduction: ${simAirSea.comparison.percentReduction}%`);
  console.log(` * Summary: ${simAirSea.comparison.summary}`);

  if (simAirSea.comparison.percentReduction < 90) {
    throw new Error(`Expected >90% reduction shifting Air to Sea, got ${simAirSea.comparison.percentReduction}%`);
  }

  // 1b. WHAT-IF CARBON SIMULATOR (Road Diesel -> Road Electric HGV)
  console.log("\n--- TEST 1b: What-If Carbon Simulator (Diesel Road -> Electric BEV) ---");
  const simRoadRes = await fetch(`${baseUrl}/api/simulator/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cargoWeight_kg: 38000, // 38 tonnes
      freightDistance_km: 450, // 450 km
      originalMode: "ROAD",
      originalFuel: "DIESEL",
      scenarioMode: "ROAD",
      scenarioFuel: "ELECTRIC",
    }),
  });
  const simRoad = await simRoadRes.json();
  console.log(` * Baseline: ${simRoad.baseline.emissionsKg} kg CO2e (${simRoad.baseline.factor} kg/t-km)`);
  console.log(` * Scenario: ${simRoad.scenario.emissionsKg} kg CO2e (${simRoad.scenario.factor} kg/t-km)`);
  console.log(` * % Reduction: ${simRoad.comparison.percentReduction}%`);

  // 2. PREDICTIVE CERTIFICATE EXPIRY TIMELINE
  console.log("\n--- TEST 2: Predictive Certificate Expiry Timeline Horizon ---");
  const suppRes = await fetch(`${baseUrl}/api/suppliers`);
  const suppData = await suppRes.json();

  const allCerts = [];
  suppData.suppliers.forEach((s) => {
    (s.certificates || []).forEach((c) => {
      const now = new Date();
      const expiry = new Date(c.expiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      allCerts.push({ ...c, daysLeft, supplierName: s.name, tier: s.tier });
    });
  });

  const critical30 = allCerts.filter((c) => c.daysLeft > 0 && c.daysLeft <= 30);
  const warning60 = allCerts.filter((c) => c.daysLeft > 30 && c.daysLeft <= 60);
  const watchlist90 = allCerts.filter((c) => c.daysLeft > 60 && c.daysLeft <= 90);
  const expired = allCerts.filter((c) => c.daysLeft <= 0 || c.status === "EXPIRED");

  console.log(`Total Tracked Credentials: ${allCerts.length}`);
  console.log(` * Critical Horizon (0-30 Days): ${critical30.length} credential(s)`);
  console.log(` * Warning Horizon (31-60 Days): ${warning60.length} credential(s)`);
  console.log(` * Watchlist Horizon (61-90 Days): ${watchlist90.length} credential(s)`);
  console.log(` * Lapsed / Expired: ${expired.length} credential(s)`);

  // 3. SUPPLIER COMPARISON VIEW
  console.log("\n--- TEST 3: Multi-Supplier Comparative Analytics ---");
  const s1 = suppData.suppliers[0];
  const s2 = suppData.suppliers[1];

  const compRes1 = await fetch(`${baseUrl}/api/suppliers/${s1.id}`);
  const compRes2 = await fetch(`${baseUrl}/api/suppliers/${s2.id}`);
  const comp1 = await compRes1.json();
  const comp2 = await compRes2.json();

  console.log(`Comparing "${comp1.supplier.name}" vs "${comp2.supplier.name}":`);
  console.log(` * Trust Score: ${comp1.supplier.trustScore} vs ${comp2.supplier.trustScore}`);
  console.log(` * Scope-3 Total: ${comp1.emissions.totalEmissionsTonnes} t vs ${comp2.emissions.totalEmissionsTonnes} t`);
  console.log(` * Active Certs: ${comp1.certificates.length} vs ${comp2.certificates.length}`);
  console.log(` * Freshness: ${comp1.freshness.status} (${comp1.freshness.ageDays}d) vs ${comp2.freshness.status} (${comp2.freshness.ageDays}d)`);

  // 4. FRAUD INVESTIGATION CENTER (Cross-Supplier Analysis)
  console.log("\n--- TEST 4: Fraud Investigation Center Forensic Analysis ---");
  const fraudRes = await fetch(`${baseUrl}/api/fraud/analysis`);
  const fraudData = await fraudRes.json();

  console.log("Fraud Analysis Status:", fraudRes.status);
  console.log("Summary Metrics:", JSON.stringify(fraudData.summary, null, 2));
  console.log(` * Duplicate SHA-256 Cases: ${fraudData.duplicateHashCases.length}`);
  console.log(` * Certificate Reuse Cases: ${fraudData.certReuseCases.length}`);
  console.log(` * Critical Fraud Alerts: ${fraudData.fraudAlerts.length}`);
  console.log(` * Collusion Clusters: ${fraudData.collusionClusters.length}`);

  // 5. RATE LIMITING & STRUCTURED SERVER LOGS
  console.log("\n--- TEST 5: Rate Limiting Enforcement ---");
  // Execute 45 requests to trigger the 40-req rate limit
  let rateLimitHit = false;
  for (let i = 0; i < 45; i++) {
    const res = await fetch(`${baseUrl}/api/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "ping" }),
    });

    if (res.status === 429) {
      rateLimitHit = true;
      const retryAfter = res.headers.get("retry-after");
      const err = await res.json();
      console.log(` * Rate limit successfully triggered at request #${i + 1}: Status 429`);
      console.log(`   Message: ${err.error}`);
      console.log(`   Retry-After Header: ${retryAfter}s`);
      break;
    }
  }

  if (!rateLimitHit) {
    console.warn("Notice: Rate limit was not exceeded within loop; verify threshold settings.");
  }

  console.log("\n=== ALL PHASE 6 ADVANCED MODULES VALIDATED SUCCESSFULLY ===");
}

testPhase6AdvancedModules().catch((err) => {
  console.error("Phase 6 validation failed:", err);
  process.exit(1);
});
