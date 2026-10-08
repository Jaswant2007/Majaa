const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function sha256(data) {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
}

async function main() {
  console.log('--- SEEDING ENTERPRISE ESG & MULTI-TIER SUPPLY CHAIN DATABASE ---');

  // Clear all existing tables cleanly
  await prisma.auditEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.emissionCalculation.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.document.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.blacklistEntry.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.enterprise.deleteMany();

  // 1. Seed Enterprise
  const enterprise = await prisma.enterprise.create({
    data: {
      name: 'Zephoria Industrial Group AG',
      registrationNo: 'CHE-882.109.344',
      country: 'Switzerland',
      industry: 'Advanced Industrial Manufacturing & Sustainable CleanTech',
    },
  });

  // 2. Seed 4 RBAC Users (One per role)
  const passwordHash = sha256('zephoria2026');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@zephoria.com',
      name: 'Elena Rostova',
      role: 'ENTERPRISE_ADMIN',
      passwordHash,
      enterpriseId: enterprise.id,
    },
  });

  const complianceUser = await prisma.user.create({
    data: {
      email: 'compliance@zephoria.com',
      name: 'Marcus Vance',
      role: 'COMPLIANCE_OFFICER',
      passwordHash,
      enterpriseId: enterprise.id,
    },
  });

  const sustainabilityUser = await prisma.user.create({
    data: {
      email: 'sustainability@zephoria.com',
      name: 'Dr. Anya Sharma',
      role: 'SUSTAINABILITY_MANAGER',
      passwordHash,
      enterpriseId: enterprise.id,
    },
  });

  // 3. Seed Emission Factors (DEFRA 2024.1, EPA, GLEC) with versions and regions
  const factorsData = [
    {
      transportMode: 'ROAD',
      fuelType: 'DIESEL',
      region: 'EU',
      factor: 0.0962,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'DEFRA 2024 (Articulated HGV >33t Diesel)',
      version: '2024.1',
    },
    {
      transportMode: 'ROAD',
      fuelType: 'ELECTRIC',
      region: 'EU',
      factor: 0.0210,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'GLEC v3.0 / DEFRA 2024 (Battery Electric HGV)',
      version: '2024.1',
    },
    {
      transportMode: 'ROAD',
      fuelType: 'HYDROGEN',
      region: 'GLOBAL',
      factor: 0.0145,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'GLEC Framework v3.0 (Fuel Cell Electric)',
      version: '2024.1',
    },
    {
      transportMode: 'RAIL',
      fuelType: 'ELECTRIC',
      region: 'EU',
      factor: 0.0118,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'DEFRA 2024 (Electric Freight Locomotive)',
      version: '2024.1',
    },
    {
      transportMode: 'RAIL',
      fuelType: 'DIESEL',
      region: 'US',
      factor: 0.0321,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'EPA GHG Hub 2024 (Class I Railroad)',
      version: '2024.1',
    },
    {
      transportMode: 'SEA',
      fuelType: 'HEAVY_FUEL_OIL',
      region: 'GLOBAL',
      factor: 0.0161,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'IMO / DEFRA 2024 (Container Ship 8000+ TEU)',
      version: '2024.1',
    },
    {
      transportMode: 'SEA',
      fuelType: 'LNG',
      region: 'GLOBAL',
      factor: 0.0134,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'IMO / GLEC v3.0 (LNG Dual-Fuel Carrier)',
      version: '2024.1',
    },
    {
      transportMode: 'AIR',
      fuelType: 'JET_A1',
      region: 'GLOBAL',
      factor: 0.6025,
      unit: 'kg_CO2e_per_tonne_km',
      source: 'ICAO / DEFRA 2024 (Dedicated Freight Jet)',
      version: '2024.1',
    },
    {
      transportMode: 'ELECTRICITY',
      fuelType: 'GRID_AVERAGE',
      region: 'EU',
      factor: 0.2850,
      unit: 'kg_CO2e_per_kwh',
      source: 'EEA 2024 EU-27 Grid Emission Factor',
      version: '2024.1',
    },
  ];

  const factorMap = {};
  for (const f of factorsData) {
    const created = await prisma.emissionFactor.create({ data: f });
    factorMap[`${f.transportMode}_${f.fuelType}`] = created;
  }

  // 4. Seed Blacklist Watchlist Entries
  await prisma.blacklistEntry.create({
    data: {
      entityName: 'Katanga Raw Mineral Syndicate',
      country: 'DR Congo',
      reason: 'OFAC Sanction & OECD Due Diligence Violation: Child labor in artisanal cobalt supply chain and fraudulent chain-of-custody documentation',
      listingSource: 'OFAC_SDN_DRC_2024',
      active: true,
    },
  });

  await prisma.blacklistEntry.create({
    data: {
      entityName: 'Vostok Carbon Offsets Trading Ltd',
      country: 'Cyprus',
      reason: 'EU Market Abuse Sanction: Phantom carbon credit issuance and fraudulent Scope 1-3 audit stamp forgery',
      listingSource: 'EU_SANCTIONS_REG_2024',
      active: true,
    },
  });

  // 5. Seed 8 Tier-1 Suppliers
  const t1Data = [
    {
      name: 'Apex Global Logistics BV',
      normalizedName: 'apex global logistics bv',
      registrationNo: 'NL-KVK-88491021',
      country: 'Netherlands',
      trustScore: 95.8,
      status: 'VERIFIED',
    },
    {
      name: 'Nordic Eco-Fiber AB',
      normalizedName: 'nordic eco-fiber ab',
      registrationNo: 'SE-ORG-556102-9981',
      country: 'Sweden',
      trustScore: 92.4,
      status: 'VERIFIED',
    },
    {
      name: 'Rhineland Automotive Assembly GmbH',
      normalizedName: 'rhineland automotive assembly gmbh',
      registrationNo: 'DE-HRB-772910',
      country: 'Germany',
      trustScore: 94.0,
      status: 'VERIFIED',
    },
    {
      name: 'Helvetia Precision Motors AG',
      normalizedName: 'helvetia precision motors ag',
      registrationNo: 'CHE-109.448.219',
      country: 'Switzerland',
      trustScore: 96.2,
      status: 'VERIFIED',
    },
    {
      name: 'Gallia Clean Mobility SAS',
      normalizedName: 'gallia clean mobility sas',
      registrationNo: 'FR-RCS-918273645',
      country: 'France',
      trustScore: 89.5,
      status: 'VERIFIED',
    },
    {
      name: 'Iberia Solar Logistics SL',
      normalizedName: 'iberia solar logistics sl',
      registrationNo: 'ES-B-88392019',
      country: 'Spain',
      trustScore: 91.0,
      status: 'VERIFIED',
    },
    {
      name: 'Lombardia Green Logistics SpA',
      normalizedName: 'lombardia green logistics spa',
      registrationNo: 'IT-REA-MI-2098471',
      country: 'Italy',
      trustScore: 88.0,
      status: 'VERIFIED',
    },
    {
      name: 'Thames Gateway Distribution Ltd',
      normalizedName: 'thames gateway distribution ltd',
      registrationNo: 'UK-CO-10928374',
      country: 'United Kingdom',
      trustScore: 90.5,
      status: 'VERIFIED',
    },
  ];

  const t1Suppliers = [];
  for (const t of t1Data) {
    const s = await prisma.supplier.create({
      data: {
        enterpriseId: enterprise.id,
        tier: 1,
        lastVerifiedAt: new Date(),
        ...t,
      },
    });
    t1Suppliers.push(s);
  }

  // Create Supplier User account for Tier-1 Apex Global
  const supplierUser = await prisma.user.create({
    data: {
      email: 'supplier@apexlogistics.nl',
      name: 'Jan de Vries',
      role: 'SUPPLIER_USER',
      passwordHash,
      enterpriseId: enterprise.id,
      supplierId: t1Suppliers[0].id,
    },
  });

  // 6. Seed 6 Tier-2 Suppliers (Linked to Tier-1 parents)
  const t2Data = [
    {
      name: 'Trans-Eurasia Freight Corp',
      normalizedName: 'trans-eurasia freight corp',
      registrationNo: 'PL-KRS-0000918273',
      country: 'Poland',
      trustScore: 68.0, // PROBLEMATIC: Expired certificate!
      status: 'REQUIRES_REVIEW',
      parentSupplierId: t1Suppliers[0].id, // Linked to Apex
    },
    {
      name: 'Shenzhen Precision Micro-Electronics Ltd',
      normalizedName: 'shenzhen precision micro-electronics ltd',
      registrationNo: 'CN-USCI-91440300MA5F',
      country: 'China',
      trustScore: 89.0,
      status: 'VERIFIED',
      parentSupplierId: t1Suppliers[2].id, // Linked to Rhineland
    },
    {
      name: 'Silesia Structural Steel Sp z o.o.',
      normalizedName: 'silesia structural steel sp z o.o.',
      registrationNo: 'PL-KRS-0000847291',
      country: 'Poland',
      trustScore: 84.5,
      status: 'VERIFIED',
      parentSupplierId: t1Suppliers[2].id,
    },
    {
      name: 'Osaka Battery Components KK',
      normalizedName: 'osaka battery components kk',
      registrationNo: 'JP-HOJIN-120001099823',
      country: 'Japan',
      trustScore: 93.0,
      status: 'VERIFIED',
      parentSupplierId: t1Suppliers[3].id, // Linked to Helvetia
    },
    {
      name: 'Monterrey Heavy Castings SA de CV',
      normalizedName: 'monterrey heavy castings sa de cv',
      registrationNo: 'MX-RFC-MHC880912K91',
      country: 'Mexico',
      trustScore: 74.0, // PROBLEMATIC: High emissions intensity
      status: 'REQUIRES_REVIEW',
      parentSupplierId: t1Suppliers[4].id,
    },
    {
      name: 'Flanders Wire & Cable NV',
      normalizedName: 'flanders wire & cable nv',
      registrationNo: 'BE-KBO-0449.192.831',
      country: 'Belgium',
      trustScore: 87.5,
      status: 'VERIFIED',
      parentSupplierId: t1Suppliers[5].id,
    },
  ];

  const t2Suppliers = [];
  for (const t of t2Data) {
    const s = await prisma.supplier.create({
      data: {
        enterpriseId: enterprise.id,
        tier: 2,
        lastVerifiedAt: new Date(Date.now() - 30 * 86400000),
        ...t,
      },
    });
    t2Suppliers.push(s);
  }

  // 7. Seed 6 Tier-3 Suppliers (Linked to Tier-2 parents)
  const t3Data = [
    {
      name: 'Atacama Mineral Refineries SA',
      normalizedName: 'atacama mineral refineries sa',
      registrationNo: 'CL-RUT-76.891.029-4',
      country: 'Chile',
      trustScore: 85.0,
      status: 'VERIFIED',
      parentSupplierId: t2Suppliers[3].id, // Linked to Osaka Battery
    },
    {
      name: 'Katanga Raw Mineral Syndicate',
      normalizedName: 'katanga raw mineral syndicate',
      registrationNo: 'CD-RCCM-18-B-0982',
      country: 'DR Congo',
      trustScore: 18.0, // PROBLEMATIC: BLACKLISTED
      status: 'BLACKLISTED',
      blacklisted: true,
      parentSupplierId: t2Suppliers[3].id,
    },
    {
      name: 'Pilbara Green Iron Corp',
      normalizedName: 'pilbara green iron corp',
      registrationNo: 'AU-ACN-098-765-432',
      country: 'Australia',
      trustScore: 91.5,
      status: 'VERIFIED',
      parentSupplierId: t2Suppliers[2].id, // Linked to Silesia Steel
    },
    {
      name: 'Kalimantan Bauxite Extraction PT',
      normalizedName: 'kalimantan bauxite extraction pt',
      registrationNo: 'ID-NIB-912000984716',
      country: 'Indonesia',
      trustScore: 62.0, // PROBLEMATIC: Stale data (>18 months)
      status: 'REQUIRES_REVIEW',
      parentSupplierId: t2Suppliers[4].id,
    },
    {
      name: 'Norrland Recycled Steel AB',
      normalizedName: 'norrland recycled steel ab',
      registrationNo: 'SE-ORG-556987-1234',
      country: 'Sweden',
      trustScore: 94.0,
      status: 'VERIFIED',
      parentSupplierId: t2Suppliers[2].id,
    },
    {
      name: 'Zambezi Cobalt Artisanal Cooperative',
      normalizedName: 'zambezi cobalt artisanal cooperative',
      registrationNo: 'ZM-PACRA-2019-99481',
      country: 'Zambia',
      trustScore: 42.0, // PROBLEMATIC: Suspicious doc & Missing cert
      status: 'HIGH_RISK',
      parentSupplierId: t2Suppliers[0].id,
    },
  ];

  const t3Suppliers = [];
  for (const t of t3Data) {
    const s = await prisma.supplier.create({
      data: {
        enterpriseId: enterprise.id,
        tier: 3,
        lastVerifiedAt: t.trustScore > 70 ? new Date() : new Date('2023-01-15'),
        ...t,
      },
    });
    t3Suppliers.push(s);
  }

  // 8. Seed Certificates (Good, Expired, Expiring in 5 days, Forged)
  const in5Days = new Date(Date.now() + 5 * 86400000);
  const expired1YearAgo = new Date('2024-02-01');
  const valid2027 = new Date('2027-06-30');

  // Good cert: Apex
  await prisma.certificate.create({
    data: {
      supplierId: t1Suppliers[0].id,
      number: 'CERT-ISO-14064-APEX-2024',
      type: 'ISO_14064',
      issuer: 'TÜV Rheinland Nederland',
      issueDate: new Date('2024-01-15'),
      expiryDate: valid2027,
      status: 'ACTIVE',
    },
  });

  // Expiring in 5 days cert: Nordic Eco-Fiber
  await prisma.certificate.create({
    data: {
      supplierId: t1Suppliers[1].id,
      number: 'CERT-ECO-FIBER-5D',
      type: 'GOTS',
      issuer: 'SGS Scandinavian Services',
      issueDate: new Date('2023-10-15'),
      expiryDate: in5Days,
      status: 'EXPIRING_SOON',
    },
  });

  // Expired cert: Trans-Eurasia (Expired 2024-02-01)
  await prisma.certificate.create({
    data: {
      supplierId: t2Suppliers[0].id,
      number: 'CERT-ECO-TE-8812',
      type: 'ISO_14064',
      issuer: 'DEKRA Certification Poland',
      issueDate: new Date('2022-02-01'),
      expiryDate: expired1YearAgo,
      status: 'EXPIRED',
    },
  });

  // Forged cert: Katanga
  await prisma.certificate.create({
    data: {
      supplierId: t3Suppliers[1].id,
      number: 'CERT-FORGED-KT-900',
      type: 'ISO_14064',
      issuer: 'Unaccredited Shell Authority',
      issueDate: new Date('2021-01-01'),
      expiryDate: new Date('2023-01-01'),
      status: 'FORGED',
    },
  });

  // Good cert: Shenzhen
  await prisma.certificate.create({
    data: {
      supplierId: t2Suppliers[1].id,
      number: 'CERT-ISO-50001-SZ-2023',
      type: 'ISO_50001',
      issuer: 'Bureau Veritas China',
      issueDate: new Date('2023-10-10'),
      expiryDate: new Date('2026-10-09'),
      status: 'ACTIVE',
    },
  });

  // 9. Seed Shipments & Deterministic Emission Calculations
  // Shipment 1: Apex (Verified Electric Road Freight)
  const shipApex = await prisma.shipment.create({
    data: {
      supplierId: t1Suppliers[0].id,
      manifestId: 'MNF-APX-2024-EV01',
      origin: 'Rotterdam Port, NL',
      destination: 'Antwerp Distribution Hub, BE',
      distanceKm: 120.0,
      weightTonnes: 45.0,
      transportMode: 'ROAD',
      fuelType: 'ELECTRIC',
      vehicleId: 'NL-EV-HGV-01',
      carrierName: 'Apex Green Corridor',
      status: 'VERIFIED',
    },
  });

  const apexFactor = factorMap['ROAD_ELECTRIC'];
  const apexKgCO2e = Number((120.0 * 45.0 * apexFactor.factor).toFixed(4));
  await prisma.emissionCalculation.create({
    data: {
      calculationId: 'CALC-APX-001',
      shipmentId: shipApex.id,
      activityData: JSON.stringify({ distanceKm: 120, weightTonnes: 45, tonneKm: 5400 }),
      emissionFactorId: apexFactor.id,
      factorVersion: apexFactor.version,
      formula: 'distanceKm * weightTonnes * factor (120 * 45 * 0.0210)',
      result: apexKgCO2e,
      unit: 'kg_CO2e',
    },
  });

  // Shipment 2: Trans-Eurasia (Heavy Diesel Freight)
  const shipTE = await prisma.shipment.create({
    data: {
      supplierId: t2Suppliers[0].id,
      manifestId: 'MNF-TE-2024-998',
      origin: 'Warsaw Freight Terminal, PL',
      destination: 'Rotterdam Port, NL',
      distanceKm: 1150.0,
      weightTonnes: 38.2,
      transportMode: 'ROAD',
      fuelType: 'DIESEL',
      carrierName: 'Trans-Eurasia Fleet Unit 04',
      status: 'FLAGGED',
    },
  });

  const teFactor = factorMap['ROAD_DIESEL'];
  const teKgCO2e = Number((1150.0 * 38.2 * teFactor.factor).toFixed(4));
  await prisma.emissionCalculation.create({
    data: {
      calculationId: 'CALC-TE-998',
      shipmentId: shipTE.id,
      activityData: JSON.stringify({ distanceKm: 1150, weightTonnes: 38.2, tonneKm: 43930 }),
      emissionFactorId: teFactor.id,
      factorVersion: teFactor.version,
      formula: 'distanceKm * weightTonnes * factor (1150 * 38.2 * 0.0962)',
      result: teKgCO2e,
      unit: 'kg_CO2e',
    },
  });

  // 10. Seed Diverse Explainable Alerts (Good mix of problems requested!)
  // 1. Expired Cert Alert
  await prisma.alert.create({
    data: {
      supplierId: t2Suppliers[0].id,
      type: 'EXPIRED_CERT',
      severity: 'CRITICAL',
      whatHappened: 'Transport manifest submitted under expired ISO-14064 greenhouse gas certificate CERT-ECO-TE-8812.',
      whyItMatters: 'EU CSRD and CBAM non-compliance fines apply when unverified freight data enters Scope-3 accounting.',
      evidence: JSON.stringify({ certNumber: 'CERT-ECO-TE-8812', expiredOn: '2024-02-01', daysOverdue: 250 }),
      recommendedAction: 'Suspend Trans-Eurasia automatic clearance; mandate third-party recertification audit within 14 days.',
      status: 'OPEN',
    },
  });

  // 2. Expiring in 5 Days Alert
  await prisma.alert.create({
    data: {
      supplierId: t1Suppliers[1].id,
      type: 'EXPIRING_SOON',
      severity: 'WARNING',
      whatHappened: 'GOTS Sustainable Packaging Certificate CERT-ECO-FIBER-5D will expire in 5 calendar days.',
      whyItMatters: 'Failure to renew will invalidate all upcoming Tier-1 packaging shipments for Q4 disclosures.',
      evidence: JSON.stringify({ certNumber: 'CERT-ECO-FIBER-5D', expiryDate: in5Days.toISOString(), daysRemaining: 5 }),
      recommendedAction: 'Trigger automated renewal request to SGS Scandinavian Services registry.',
      status: 'OPEN',
    },
  });

  // 3. Blacklist Match Alert
  await prisma.alert.create({
    data: {
      supplierId: t3Suppliers[1].id,
      type: 'BLACKLIST_HIT',
      severity: 'CRITICAL',
      whatHappened: 'Direct entity match on OFAC SDN List (SDN-DRC-2024) and OECD Due Diligence Sanction Registry.',
      whyItMatters: 'Statutory trade embargo; severe corporate criminal liability for importing sanctioned cobalt into Tier-1 product line.',
      evidence: JSON.stringify({ entity: 'Katanga Raw Mineral Syndicate', registry: 'OFAC_SDN_DRC_2024', matchConfidence: 1.0 }),
      recommendedAction: 'Immediate contract termination, quarantine all upstream inventory, submit disclosure to compliance oversight.',
      status: 'OPEN',
    },
  });

  // 4. Identity Mismatch Alert
  await prisma.alert.create({
    data: {
      supplierId: t3Suppliers[5].id,
      type: 'IDENTITY_MISMATCH',
      severity: 'CRITICAL',
      whatHappened: 'Manifest shipper name "Katanga Mining Logistics" conflicts with registered vendor "Zambezi Cobalt".',
      whyItMatters: 'Indicates high probability of prohibited entity masquerading or unauthorized subcontracting to bypass sanctions.',
      evidence: JSON.stringify({ declaredVendor: 'Zambezi Cobalt', physicalShipper: 'Katanga Mining Logistics', originGPS: '-10.716, 25.472' }),
      recommendedAction: 'Halt consignment entry, demand bill of lading chain-of-custody documentation.',
      status: 'OPEN',
    },
  });

  // 5. High Emissions Alert
  await prisma.alert.create({
    data: {
      supplierId: t2Suppliers[4].id,
      type: 'HIGH_EMISSIONS',
      severity: 'WARNING',
      whatHappened: 'Heavy casting shipments from Monterrey facility exceed benchmark intensity by 185% (bunker diesel vs electric baseline).',
      whyItMatters: 'Jeopardizes Zephoria 2030 Science-Based Targets (SBTi) 45% Scope-3 reduction target.',
      evidence: JSON.stringify({ actualIntensityKgCO2ePerTonne: 420.5, sectorBenchmark: 147.2, excessEmissionsKg: 18450 }),
      recommendedAction: 'Initiate supplier decarbonization transition plan; explore intermodal rail routing.',
      status: 'OPEN',
    },
  });

  // 6. Stale Data Alert
  await prisma.alert.create({
    data: {
      supplierId: t3Suppliers[3].id,
      type: 'STALE_DATA',
      severity: 'WARNING',
      whatHappened: 'Kalimantan Bauxite facility has not submitted verified utility or transport disclosures for 18 months.',
      whyItMatters: 'CSRD assurance standards require annual empirical primary activity data.',
      evidence: JSON.stringify({ lastAuditDate: '2023-01-15', monthsSinceUpdate: 18 }),
      recommendedAction: 'Issue formal ESG data compliance notice; downgrade trust score to 62.',
      status: 'OPEN',
    },
  });

  // 7. Missing Document Alert
  await prisma.alert.create({
    data: {
      supplierId: t1Suppliers[6].id,
      type: 'MISSING_DOC',
      severity: 'INFO',
      whatHappened: 'Shipment MNF-LOM-2024-11 logged via EDI without attached PDF consignment note.',
      whyItMatters: 'Mandatory proof of origin missing for third-party auditor sampling.',
      evidence: JSON.stringify({ manifestId: 'MNF-LOM-2024-11', missingFiles: ['BillOfLading.pdf'] }),
      recommendedAction: 'Automated notification dispatched to Lombardia portal desk.',
      status: 'OPEN',
    },
  });

  // 11. Seed Audit Events (Immutable Cryptographic Ledger)
  const auditEntries = [
    {
      actor: adminUser.email,
      action: 'CREATED',
      entityType: 'ENTERPRISE',
      entityId: enterprise.id,
      source: 'WEB_PORTAL',
      reason: 'Enterprise tenant initialized with DEFRA 2024 Scope-3 accounting rules',
    },
    {
      actor: complianceUser.email,
      action: 'VERIFIED',
      entityType: 'SUPPLIER',
      entityId: t1Suppliers[0].id,
      source: 'AUDIT_RUNNER',
      reason: 'Apex Global Logistics BV Tier-1 audit completed; valid ISO-14064 cert verified',
    },
    {
      actor: 'SYSTEM',
      action: 'FLAGGED',
      entityType: 'SUPPLIER',
      entityId: t2Suppliers[0].id,
      source: 'BACKGROUND_RUNNER',
      reason: 'Automated certificate scanner detected expired CERT-ECO-TE-8812; trust score lowered to 68.0',
    },
    {
      actor: 'SYSTEM',
      action: 'FLAGGED',
      entityType: 'SUPPLIER',
      entityId: t3Suppliers[1].id,
      source: 'BACKGROUND_RUNNER',
      reason: 'Sanction watch list match on OFAC SDN-DRC-2024; Katanga entity blacklisted and quarantined',
    },
    {
      actor: sustainabilityUser.email,
      action: 'CALCULATED',
      entityType: 'SHIPMENT',
      entityId: shipApex.id,
      source: 'SCOPE3_CALCULATOR',
      reason: 'Deterministic Scope-3 calculation: 120 km * 45 t * 0.0210 kg CO2e/t-km = 113.4 kg CO2e',
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditEvent.create({ data: entry });
  }

  console.log('--- SEED COMPLETED SUCCESSFULLY! ---');
  console.log(`Enterprise: ${enterprise.name}`);
  console.log(`Users Created: 4 (Enterprise Admin, Compliance Officer, Sustainability Manager, Supplier User)`);
  console.log(`Suppliers Created: 20 (8 Tier-1, 6 Tier-2, 6 Tier-3)`);
  console.log(`Emission Factors: ${factorsData.length}`);
  console.log(`Alerts Created: 7 (Expired cert, Expiring 5d, Blacklist hit, Identity mismatch, High emissions, Stale data, Missing doc)`);
  console.log(`Audit Events: ${auditEntries.length}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
