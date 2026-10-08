import { z } from "zod";

// Transport Mode Enum
export const TransportModeSchema = z.enum(["ROAD", "RAIL", "AIR", "SEA"]);
export type TransportMode = z.infer<typeof TransportModeSchema>;

// Fuel Type Enum
export const FuelTypeSchema = z.enum([
  "DIESEL",
  "ELECTRIC",
  "HYDROGEN",
  "JET_A1",
  "HEAVY_FUEL_OIL",
  "LNG",
  "GRID_AVERAGE",
]);
export type FuelType = z.infer<typeof FuelTypeSchema>;

// Document Status Enum (Zero-trust states)
export const DocumentStatusSchema = z.enum([
  "UNVERIFIED",
  "PROCESSING",
  "EXTRACTED",
  "VALIDATION_FAILED",
  "REQUIRES_REVIEW",
  "VERIFIED",
  "REJECTED",
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

// 1. Strict Schema for Logistics Manifest Extraction (Rule 4: untrusted LLM output validation)
export const ManifestExtractionSchema = z.object({
  manifestId: z.string().min(3, "Manifest identifier required"),
  supplierName: z.string().min(2, "Supplier name is required"),
  supplierCode: z.string().optional(),
  origin: z.string().min(2, "Origin location required"),
  destination: z.string().min(2, "Destination location required"),
  distanceKm: z.number().positive("Distance must be a positive number"),
  weightTonnes: z.number().positive("Weight must be a positive number"),
  transportMode: TransportModeSchema,
  fuelType: FuelTypeSchema,
  vehicleId: z.string().optional(),
  certificateRef: z.string().optional(),
  carrierName: z.string().optional(),
  notes: z.string().optional(),
});
export type ManifestExtraction = z.infer<typeof ManifestExtractionSchema>;

// 2. Strict Schema for Compliance Certificate Extraction
export const CertificateExtractionSchema = z.object({
  certNumber: z.string().min(3, "Certificate number required"),
  certType: z.enum(["ISO_14064", "ISO_50001", "GOTS", "ECOVADIS", "FAIR_LABOR"]),
  supplierName: z.string().min(2, "Certified entity name required"),
  issuer: z.string().min(2, "Issuing authority required"),
  issueDate: z.string().datetime({ message: "Valid ISO date required for issue date" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  expiryDate: z.string().datetime({ message: "Valid ISO date required for expiry date" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  scopeDescription: z.string().optional(),
});
export type CertificateExtraction = z.infer<typeof CertificateExtractionSchema>;

// 3. Strict Schema for Utility Bill Extraction (Electricity / Fuel)
export const UtilityBillExtractionSchema = z.object({
  billNumber: z.string().min(3),
  facilityName: z.string().min(2),
  energyConsumedKWh: z.number().positive(),
  billingPeriodStart: z.string(),
  billingPeriodEnd: z.string(),
  gridProvider: z.string().min(2),
});
export type UtilityBillExtraction = z.infer<typeof UtilityBillExtractionSchema>;

// Combined schema for untrusted extractor payload
export const ExtractedDocumentDataSchema = z.discriminatedUnion("docType", [
  z.object({
    docType: z.literal("LOGISTICS_MANIFEST"),
    data: ManifestExtractionSchema,
  }),
  z.object({
    docType: z.literal("COMPLIANCE_CERT"),
    data: CertificateExtractionSchema,
  }),
  z.object({
    docType: z.literal("UTILITY_BILL"),
    data: UtilityBillExtractionSchema,
  }),
]);
export type ExtractedDocumentData = z.infer<typeof ExtractedDocumentDataSchema>;

// Alert Schema with Mandatory Explainable Evidence (Rule 9)
export const ComplianceAlertCreateSchema = z.object({
  supplierId: z.string(),
  documentId: z.string().optional(),
  severity: z.enum(["CRITICAL", "WARNING", "INFO"]),
  alertType: z.enum([
    "EXPIRED_CERT",
    "BLACKLIST_HIT",
    "IDENTITY_MISMATCH",
    "UNUSUAL_FACTOR",
    "TAMPER_DETECTED",
    "CERTIFICATE_NOT_FOUND",
  ]),
  title: z.string().min(5),
  evidence: z.string().min(10, "Alert evidence must cite specific entities and reasons"),
});
export type ComplianceAlertCreate = z.infer<typeof ComplianceAlertCreateSchema>;
