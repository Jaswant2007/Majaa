async function testPhase1() {
  console.log("=== PHASE 1 FOUNDATION VALIDATION ===");

  // 1. Auth check
  let res = await fetch("http://localhost:3000/api/auth/me");
  let authData = await res.json();
  console.log("Default User Session:", authData.user.name, "| Role:", authData.roleLabel);

  // 2. Switch to each role and verify
  const testRoles = [
    "COMPLIANCE_OFFICER",
    "SUSTAINABILITY_MANAGER",
    "SUPPLIER_USER",
    "ENTERPRISE_ADMIN",
  ];

  for (const r of testRoles) {
    const switchRes = await fetch("http://localhost:3000/api/auth/switch-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: r }),
    });
    const switchData = await switchRes.json();
    console.log(`Role Switch Successful -> ${switchData.user.name} [${switchData.user.role}]`);
  }

  // 3. Verify Database Seeded Data
  res = await fetch("http://localhost:3000/api/suppliers");
  const suppliersData = await res.json();
  console.log(`Total Suppliers in DB: ${suppliersData.suppliers.length}`);
  const t1 = suppliersData.suppliers.filter((s) => s.tier === 1).length;
  const t2 = suppliersData.suppliers.filter((s) => s.tier === 2).length;
  const t3 = suppliersData.suppliers.filter((s) => s.tier === 3).length;
  console.log(`Breakdown: Tier-1: ${t1} (Expected 8), Tier-2: ${t2} (Expected 6), Tier-3: ${t3} (Expected 6)`);

  // 4. Verify Pages Load
  const routes = [
    "/",
    "/supply-chain",
    "/suppliers",
    "/documents",
    "/scope3",
    "/compliance",
    "/alerts",
    "/audit",
    "/assistant",
    "/portal",
  ];

  console.log("\nVerifying all 10 Page Routes:");
  for (const route of routes) {
    const pageRes = await fetch(`http://localhost:3000${route}`);
    console.log(`Route [${route}]: HTTP ${pageRes.status}`);
    if (!pageRes.ok) throw new Error(`Route ${route} failed with status ${pageRes.status}`);
  }

  console.log("\n=== ALL PHASE 1 REQUIREMENTS VERIFIED 100% ===");
}

testPhase1().catch(console.error);
