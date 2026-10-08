-- ==============================================================================
-- SOURCETRACE SEED DATA (SUPABASE POSTGRESQL IDEMPOTENT SEED)
-- ==============================================================================

-- 1. Enterprise
INSERT INTO "Enterprise" ("id", "name", "registrationNo", "country", "industry", "createdAt", "updatedAt")
VALUES (
  'ent_zephoria_001',
  'Zephoria Industrial Group AG',
  'CHE-882.109.344',
  'Switzerland',
  'Advanced Industrial Manufacturing & Sustainable CleanTech',
  NOW(),
  NOW()
)
ON CONFLICT ("registrationNo") DO NOTHING;

-- 2. Users (Password: zephoria2026 -> sha256 hash)
INSERT INTO "User" ("id", "email", "name", "role", "passwordHash", "enterpriseId", "createdAt", "updatedAt")
VALUES
  ('usr_admin_001', 'admin@zephoria.com', 'Elena Rostova', 'ENTERPRISE_ADMIN', '0812e3e6027ad2f8b5f39e3ec0f0c05f560e2ce95eeae90076bbd92bc9fcebbf', 'ent_zephoria_001', NOW(), NOW()),
  ('usr_comp_001', 'compliance@zephoria.com', 'Marcus Vance', 'COMPLIANCE_OFFICER', '0812e3e6027ad2f8b5f39e3ec0f0c05f560e2ce95eeae90076bbd92bc9fcebbf', 'ent_zephoria_001', NOW(), NOW()),
  ('usr_sust_001', 'sustainability@zephoria.com', 'Dr. Anya Sharma', 'SUSTAINABILITY_MANAGER', '0812e3e6027ad2f8b5f39e3ec0f0c05f560e2ce95eeae90076bbd92bc9fcebbf', 'ent_zephoria_001', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- 3. Emission Factors
INSERT INTO "EmissionFactor" ("id", "transportMode", "fuelType", "region", "factor", "unit", "source", "version", "effectiveFrom", "createdAt")
VALUES
  ('ef_001', 'ROAD', 'DIESEL', 'EU', 0.0962, 'kg_CO2e_per_tonne_km', 'DEFRA 2024 (Articulated HGV >33t Diesel)', '2024.1', NOW(), NOW()),
  ('ef_002', 'ROAD', 'ELECTRIC', 'EU', 0.0210, 'kg_CO2e_per_tonne_km', 'GLEC v3.0 / DEFRA 2024 (Battery Electric HGV)', '2024.1', NOW(), NOW()),
  ('ef_003', 'ROAD', 'HYDROGEN', 'GLOBAL', 0.0145, 'kg_CO2e_per_tonne_km', 'GLEC Framework v3.0 (Fuel Cell Electric)', '2024.1', NOW(), NOW()),
  ('ef_004', 'RAIL', 'ELECTRIC', 'EU', 0.0118, 'kg_CO2e_per_tonne_km', 'DEFRA 2024 (Electric Freight Locomotive)', '2024.1', NOW(), NOW()),
  ('ef_005', 'RAIL', 'DIESEL', 'US', 0.0321, 'kg_CO2e_per_tonne_km', 'EPA GHG Hub 2024 (Class I Railroad)', '2024.1', NOW(), NOW()),
  ('ef_006', 'SEA', 'HEAVY_FUEL_OIL', 'GLOBAL', 0.0161, 'kg_CO2e_per_tonne_km', 'IMO / DEFRA 2024 (Container Ship 8000+ TEU)', '2024.1', NOW(), NOW()),
  ('ef_007', 'SEA', 'LNG', 'GLOBAL', 0.0134, 'kg_CO2e_per_tonne_km', 'IMO / GLEC v3.0 (LNG Dual-Fuel Carrier)', '2024.1', NOW(), NOW()),
  ('ef_008', 'AIR', 'JET_A1', 'GLOBAL', 0.6025, 'kg_CO2e_per_tonne_km', 'ICAO / DEFRA 2024 (Dedicated Freight Jet)', '2024.1', NOW(), NOW()),
  ('ef_009', 'ELECTRICITY', 'GRID_AVERAGE', 'EU', 0.2850, 'kg_CO2e_per_kwh', 'EEA 2024 EU-27 Grid Emission Factor', '2024.1', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 4. Blacklist Watchlist Entries
INSERT INTO "BlacklistEntry" ("id", "entityName", "country", "reason", "listingSource", "listedAt", "active")
VALUES
  ('bl_001', 'Katanga Raw Mineral Syndicate', 'DR Congo', 'OFAC Sanction & OECD Due Diligence Violation: Child labor in artisanal cobalt supply chain and fraudulent chain-of-custody documentation', 'OFAC_SDN_DRC_2024', NOW(), true),
  ('bl_002', 'Vostok Carbon Offsets Trading Ltd', 'Cyprus', 'EU Market Abuse Sanction: Phantom carbon credit issuance and fraudulent Scope 1-3 audit stamp forgery', 'EU_SANCTIONS_REG_2024', NOW(), true)
ON CONFLICT ("entityName") DO NOTHING;

-- 5. Tier-1 Suppliers
INSERT INTO "Supplier" ("id", "enterpriseId", "name", "normalizedName", "registrationNo", "tier", "country", "status", "trustScore", "blacklisted", "lastVerifiedAt", "createdAt", "updatedAt")
VALUES
  ('sup_t1_001', 'ent_zephoria_001', 'Apex Global Logistics BV', 'apex global logistics bv', 'NL-KVK-88491021', 1, 'Netherlands', 'VERIFIED', 95.8, false, NOW(), NOW(), NOW()),
  ('sup_t1_002', 'ent_zephoria_001', 'Nordic Eco-Fiber AB', 'nordic eco-fiber ab', 'SE-ORG-556102-9981', 1, 'Sweden', 'VERIFIED', 92.4, false, NOW(), NOW(), NOW()),
  ('sup_t1_003', 'ent_zephoria_001', 'Rhineland Automotive Assembly GmbH', 'rhineland automotive assembly gmbh', 'DE-HRB-772910', 1, 'Germany', 'VERIFIED', 94.0, false, NOW(), NOW(), NOW()),
  ('sup_t1_004', 'ent_zephoria_001', 'Helvetia Precision Motors AG', 'helvetia precision motors ag', 'CHE-109.448.219', 1, 'Switzerland', 'VERIFIED', 96.2, false, NOW(), NOW(), NOW()),
  ('sup_t1_005', 'ent_zephoria_001', 'Gallia Clean Mobility SAS', 'gallia clean mobility sas', 'FR-RCS-918273645', 1, 'France', 'VERIFIED', 89.5, false, NOW(), NOW(), NOW()),
  ('sup_t1_006', 'ent_zephoria_001', 'Iberia Solar Logistics SL', 'iberia solar logistics sl', 'ES-B-88392019', 1, 'Spain', 'VERIFIED', 91.0, false, NOW(), NOW(), NOW()),
  ('sup_t1_007', 'ent_zephoria_001', 'Lombardia Green Logistics SpA', 'lombardia green logistics spa', 'IT-REA-MI-2098471', 1, 'Italy', 'VERIFIED', 88.0, false, NOW(), NOW(), NOW()),
  ('sup_t1_008', 'ent_zephoria_001', 'Thames Gateway Distribution Ltd', 'thames gateway distribution ltd', 'UK-CO-10928374', 1, 'United Kingdom', 'VERIFIED', 90.5, false, NOW(), NOW(), NOW())
ON CONFLICT ("registrationNo") DO NOTHING;

-- Supplier User account for Tier-1 Apex Global
INSERT INTO "User" ("id", "email", "name", "role", "passwordHash", "enterpriseId", "supplierId", "createdAt", "updatedAt")
VALUES
  ('usr_supp_001', 'supplier@apexlogistics.nl', 'Jan de Vries', 'SUPPLIER_USER', '0812e3e6027ad2f8b5f39e3ec0f0c05f560e2ce95eeae90076bbd92bc9fcebbf', 'ent_zephoria_001', 'sup_t1_001', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- 6. Tier-2 Suppliers
INSERT INTO "Supplier" ("id", "enterpriseId", "name", "normalizedName", "registrationNo", "tier", "parentSupplierId", "country", "status", "trustScore", "blacklisted", "lastVerifiedAt", "createdAt", "updatedAt")
VALUES
  ('sup_t2_001', 'ent_zephoria_001', 'Trans-Eurasia Freight Corp', 'trans-eurasia freight corp', 'PL-KRS-0000918273', 2, 'sup_t1_001', 'Poland', 'REQUIRES_REVIEW', 68.0, false, NOW() - INTERVAL '30 days', NOW(), NOW()),
  ('sup_t2_002', 'ent_zephoria_001', 'Shenzhen Precision Micro-Electronics Ltd', 'shenzhen precision micro-electronics ltd', 'CN-USCI-91440300MA5F', 2, 'sup_t1_003', 'China', 'VERIFIED', 89.0, false, NOW() - INTERVAL '30 days', NOW(), NOW()),
  ('sup_t2_003', 'ent_zephoria_001', 'Silesia Structural Steel Sp z o.o.', 'silesia structural steel sp z o.o.', 'PL-KRS-0000847291', 2, 'sup_t1_003', 'Poland', 'VERIFIED', 84.5, false, NOW() - INTERVAL '30 days', NOW(), NOW()),
  ('sup_t2_004', 'ent_zephoria_001', 'Osaka Battery Components KK', 'osaka battery components kk', 'JP-HOJIN-120001099823', 2, 'sup_t1_004', 'Japan', 'VERIFIED', 93.0, false, NOW() - INTERVAL '30 days', NOW(), NOW()),
  ('sup_t2_005', 'ent_zephoria_001', 'Monterrey Heavy Castings SA de CV', 'monterrey heavy castings sa de cv', 'MX-RFC-MHC880912K91', 2, 'sup_t1_005', 'Mexico', 'REQUIRES_REVIEW', 74.0, false, NOW() - INTERVAL '30 days', NOW(), NOW()),
  ('sup_t2_006', 'ent_zephoria_001', 'Flanders Wire & Cable NV', 'flanders wire & cable nv', 'BE-KBO-0449.192.831', 2, 'sup_t1_006', 'Belgium', 'VERIFIED', 87.5, false, NOW() - INTERVAL '30 days', NOW(), NOW())
ON CONFLICT ("registrationNo") DO NOTHING;

-- 7. Tier-3 Suppliers
INSERT INTO "Supplier" ("id", "enterpriseId", "name", "normalizedName", "registrationNo", "tier", "parentSupplierId", "country", "status", "trustScore", "blacklisted", "lastVerifiedAt", "createdAt", "updatedAt")
VALUES
  ('sup_t3_001', 'ent_zephoria_001', 'Atacama Mineral Refineries SA', 'atacama mineral refineries sa', 'CL-RUT-76.891.029-4', 3, 'sup_t2_004', 'Chile', 'VERIFIED', 85.0, false, NOW(), NOW(), NOW()),
  ('sup_t3_002', 'ent_zephoria_001', 'Katanga Raw Mineral Syndicate', 'katanga raw mineral syndicate', 'CD-RCCM-18-B-0982', 3, 'sup_t2_004', 'DR Congo', 'BLACKLISTED', 18.0, true, '2023-01-15', NOW(), NOW()),
  ('sup_t3_003', 'ent_zephoria_001', 'Pilbara Green Iron Corp', 'pilbara green iron corp', 'AU-ACN-098-765-432', 3, 'sup_t2_003', 'Australia', 'VERIFIED', 91.5, false, NOW(), NOW(), NOW()),
  ('sup_t3_004', 'ent_zephoria_001', 'Kalimantan Bauxite Extraction PT', 'kalimantan bauxite extraction pt', 'ID-NIB-912000984716', 3, 'sup_t2_005', 'Indonesia', 'REQUIRES_REVIEW', 62.0, false, '2023-01-15', NOW(), NOW()),
  ('sup_t3_005', 'ent_zephoria_001', 'Norrland Recycled Steel AB', 'norrland recycled steel ab', 'SE-ORG-556987-1234', 3, 'sup_t2_003', 'Sweden', 'VERIFIED', 94.0, false, NOW(), NOW(), NOW()),
  ('sup_t3_006', 'ent_zephoria_001', 'Zambezi Cobalt Artisanal Cooperative', 'zambezi cobalt artisanal cooperative', 'ZM-PACRA-2019-99481', 3, 'sup_t2_001', 'Zambia', 'HIGH_RISK', 42.0, false, '2023-01-15', NOW(), NOW())
ON CONFLICT ("registrationNo") DO NOTHING;

-- 8. Certificates
INSERT INTO "Certificate" ("id", "supplierId", "number", "type", "issuer", "issueDate", "expiryDate", "status", "createdAt")
VALUES
  ('cert_001', 'sup_t1_001', 'CERT-ISO-14064-APEX-2024', 'ISO_14064', 'TÜV Rheinland Nederland', '2024-01-15', '2027-06-30', 'ACTIVE', NOW()),
  ('cert_002', 'sup_t1_002', 'CERT-ECO-FIBER-5D', 'GOTS', 'SGS Scandinavian Services', '2023-10-15', NOW() + INTERVAL '5 days', 'EXPIRING_SOON', NOW()),
  ('cert_003', 'sup_t2_001', 'CERT-ECO-TE-8812', 'ISO_14064', 'DEKRA Certification Poland', '2022-02-01', '2024-02-01', 'EXPIRED', NOW()),
  ('cert_004', 'sup_t3_002', 'CERT-FORGED-KT-900', 'ISO_14064', 'Unaccredited Shell Authority', '2021-01-01', '2023-01-01', 'FORGED', NOW()),
  ('cert_005', 'sup_t2_002', 'CERT-ISO-50001-SZ-2023', 'ISO_50001', 'Bureau Veritas China', '2023-10-10', '2026-10-09', 'ACTIVE', NOW())
ON CONFLICT ("number") DO NOTHING;

-- 9. Shipments & Emission Calculations
INSERT INTO "Shipment" ("id", "supplierId", "manifestId", "origin", "destination", "distanceKm", "weightTonnes", "transportMode", "fuelType", "vehicleId", "carrierName", "status", "createdAt")
VALUES
  ('shp_001', 'sup_t1_001', 'MNF-APX-2024-EV01', 'Rotterdam Port, NL', 'Antwerp Distribution Hub, BE', 120.0, 45.0, 'ROAD', 'ELECTRIC', 'NL-EV-HGV-01', 'Apex Green Corridor', 'VERIFIED', NOW()),
  ('shp_002', 'sup_t2_001', 'MNF-TE-2024-998', 'Warsaw Freight Terminal, PL', 'Rotterdam Port, NL', 1150.0, 38.2, 'ROAD', 'DIESEL', NULL, 'Trans-Eurasia Fleet Unit 04', 'FLAGGED', NOW())
ON CONFLICT ("manifestId") DO NOTHING;

INSERT INTO "EmissionCalculation" ("id", "calculationId", "shipmentId", "activityData", "emissionFactorId", "factorVersion", "formula", "result", "unit", "calculatedAt")
VALUES
  ('calc_001', 'CALC-APX-001', 'shp_001', '{"distanceKm":120,"weightTonnes":45,"tonneKm":5400}', 'ef_002', '2024.1', 'distanceKm * weightTonnes * factor (120 * 45 * 0.0210)', 113.4, 'kg_CO2e', NOW()),
  ('calc_002', 'CALC-TE-998', 'shp_002', '{"distanceKm":1150,"weightTonnes":38.2,"tonneKm":43930}', 'ef_001', '2024.1', 'distanceKm * weightTonnes * factor (1150 * 38.2 * 0.0962)', 4226.066, 'kg_CO2e', NOW())
ON CONFLICT ("calculationId") DO NOTHING;

-- 10. Alerts
INSERT INTO "Alert" ("id", "supplierId", "type", "severity", "whatHappened", "whyItMatters", "evidence", "recommendedAction", "status", "createdAt", "updatedAt")
VALUES
  ('alt_001', 'sup_t2_001', 'EXPIRED_CERT', 'CRITICAL', 'Transport manifest submitted under expired ISO-14064 greenhouse gas certificate CERT-ECO-TE-8812.', 'EU CSRD and CBAM non-compliance fines apply when unverified freight data enters Scope-3 accounting.', '{"certNumber":"CERT-ECO-TE-8812","expiredOn":"2024-02-01","daysOverdue":250}', 'Suspend Trans-Eurasia automatic clearance; mandate third-party recertification audit within 14 days.', 'OPEN', NOW(), NOW()),
  ('alt_002', 'sup_t1_002', 'EXPIRING_SOON', 'WARNING', 'GOTS Sustainable Packaging Certificate CERT-ECO-FIBER-5D will expire in 5 calendar days.', 'Failure to renew will invalidate all upcoming Tier-1 packaging shipments for Q4 disclosures.', '{"certNumber":"CERT-ECO-FIBER-5D","daysRemaining":5}', 'Trigger automated renewal request to SGS Scandinavian Services registry.', 'OPEN', NOW(), NOW()),
  ('alt_003', 'sup_t3_002', 'BLACKLIST_HIT', 'CRITICAL', 'Direct entity match on OFAC SDN List (SDN-DRC-2024) and OECD Due Diligence Sanction Registry.', 'Statutory trade embargo; severe corporate criminal liability for importing sanctioned cobalt into Tier-1 product line.', '{"entity":"Katanga Raw Mineral Syndicate","registry":"OFAC_SDN_DRC_2024","matchConfidence":1.0}', 'Immediate contract termination, quarantine all upstream inventory, submit disclosure to compliance oversight.', 'OPEN', NOW(), NOW()),
  ('alt_004', 'sup_t3_006', 'IDENTITY_MISMATCH', 'CRITICAL', 'Manifest shipper name "Katanga Mining Logistics" conflicts with registered vendor "Zambezi Cobalt".', 'Indicates high probability of prohibited entity masquerading or unauthorized subcontracting to bypass sanctions.', '{"declaredVendor":"Zambezi Cobalt","physicalShipper":"Katanga Mining Logistics"}', 'Halt consignment entry, demand bill of lading chain-of-custody documentation.', 'OPEN', NOW(), NOW()),
  ('alt_005', 'sup_t2_005', 'HIGH_EMISSIONS', 'WARNING', 'Heavy casting shipments from Monterrey facility exceed benchmark intensity by 185% (bunker diesel vs electric baseline).', 'Jeopardizes Zephoria 2030 Science-Based Targets (SBTi) 45% Scope-3 reduction target.', '{"actualIntensityKgCO2ePerTonne":420.5,"sectorBenchmark":147.2}', 'Initiate supplier decarbonization transition plan; explore intermodal rail routing.', 'OPEN', NOW(), NOW()),
  ('alt_006', 'sup_t3_004', 'STALE_DATA', 'WARNING', 'Kalimantan Bauxite facility has not submitted verified utility or transport disclosures for 18 months.', 'CSRD assurance standards require annual empirical primary activity data.', '{"lastAuditDate":"2023-01-15","monthsSinceUpdate":18}', 'Issue formal ESG data compliance notice; downgrade trust score to 62.', 'OPEN', NOW(), NOW()),
  ('alt_007', 'sup_t1_007', 'MISSING_DOC', 'INFO', 'Shipment MNF-LOM-2024-11 logged via EDI without attached PDF consignment note.', 'Mandatory proof of origin missing for third-party auditor sampling.', '{"manifestId":"MNF-LOM-2024-11","missingFiles":["BillOfLading.pdf"]}', 'Automated notification dispatched to Lombardia portal desk.', 'OPEN', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 11. Immutable Audit Ledger Events
INSERT INTO "AuditEvent" ("id", "actor", "action", "entityType", "entityId", "source", "reason", "entryHash", "prevHash", "timestamp")
VALUES
  ('aud_001', 'admin@zephoria.com', 'CREATED', 'ENTERPRISE', 'ent_zephoria_001', 'WEB_PORTAL', 'Enterprise tenant initialized with DEFRA 2024 Scope-3 accounting rules', 'hash_init_001', '0000000000000000000000000000000000000000000000000000000000000000', NOW() - INTERVAL '5 days'),
  ('aud_002', 'compliance@zephoria.com', 'VERIFIED', 'SUPPLIER', 'sup_t1_001', 'AUDIT_RUNNER', 'Apex Global Logistics BV Tier-1 audit completed; valid ISO-14064 cert verified', 'hash_audit_002', 'hash_init_001', NOW() - INTERVAL '4 days'),
  ('aud_003', 'SYSTEM', 'FLAGGED', 'SUPPLIER', 'sup_t2_001', 'BACKGROUND_RUNNER', 'Automated certificate scanner detected expired CERT-ECO-TE-8812; trust score lowered to 68.0', 'hash_audit_003', 'hash_audit_002', NOW() - INTERVAL '3 days'),
  ('aud_004', 'SYSTEM', 'FLAGGED', 'SUPPLIER', 'sup_t3_002', 'BACKGROUND_RUNNER', 'Sanction watch list match on OFAC SDN-DRC-2024; Katanga entity blacklisted and quarantined', 'hash_audit_004', 'hash_audit_003', NOW() - INTERVAL '2 days'),
  ('aud_005', 'sustainability@zephoria.com', 'CALCULATED', 'SHIPMENT', 'shp_001', 'SCOPE3_CALCULATOR', 'Deterministic Scope-3 calculation: 120 km * 45 t * 0.0210 kg CO2e/t-km = 113.4 kg CO2e', 'hash_audit_005', 'hash_audit_004', NOW() - INTERVAL '1 days')
ON CONFLICT ("id") DO NOTHING;
