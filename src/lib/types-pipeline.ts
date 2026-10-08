import { z } from "zod";

export interface FieldExtraction<T = string | number> {
  value: T;
  confidence: number; // 0.00 to 1.00
  source: "OCR_RAW" | "INVOICE_HEADER" | "LINE_ITEM" | "CERT_SECTION" | "INFERRED";
  validationStatus: "VALID" | "REQUIRES_REVIEW" | "INVALID";
}

export interface DetailedManifestExtraction {
  supplierId: FieldExtraction<string>;
  supplierName: FieldExtraction<string>;
  shipmentId: FieldExtraction<string>;
  origin: FieldExtraction<string>;
  destination: FieldExtraction<string>;
  transportMode: FieldExtraction<"ROAD" | "RAIL" | "AIR" | "SEA">;
  fuelType: FieldExtraction<"DIESEL" | "ELECTRIC" | "HYDROGEN" | "JET_A1" | "HEAVY_FUEL_OIL" | "LNG">;
  freightDistance: FieldExtraction<number>; // km
  cargoWeight: FieldExtraction<number>; // kg
  cargoType: FieldExtraction<string>;
  shipmentDate: FieldExtraction<string>; // ISO date
  certificateNumber: FieldExtraction<string>;
  certificateType: FieldExtraction<"ISO_14064" | "ISO_50001" | "GOTS" | "ECOVADIS" | "FAIR_LABOR">;
  certificateIssuer: FieldExtraction<string>;
  certificateIssueDate: FieldExtraction<string>;
  certificateExpiryDate: FieldExtraction<string>;
}

export type CertificateValidationStatus =
  | "VALID"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "MISSING"
  | "INVALID"
  | "MISMATCH";

export type ComplianceBadge =
  | "COMPLIANT"
  | "ACTION REQUIRED"
  | "UNDER REVIEW"
  | "HIGH RISK";

export const CONFIDENCE_THRESHOLD = 0.8;

export function evaluateFieldConfidence<T>(
  value: T,
  confidence: number,
  source: FieldExtraction<T>["source"]
): FieldExtraction<T> {
  return {
    value,
    confidence: Number(confidence.toFixed(2)),
    source,
    validationStatus: confidence >= CONFIDENCE_THRESHOLD ? "VALID" : "REQUIRES_REVIEW",
  };
}
