import { prisma } from "./db";
import { TransportMode, FuelType } from "./schemas";

export interface Scope3CalculationResult {
  activityDataTonneKm: number;
  emissionFactorId: string;
  emissionFactorApplied: number;
  factorSource: string;
  factorUnit: string;
  factorVersion: string;
  totalKgCO2e: number;
  totalTonnesCO2e: number;
  formulaUsed: string;
  deterministicAuditLog: string;
}

/**
 * Deterministic Scope-3 Emissions Calculator
 * RULE: LLM NEVER calculates emissions.
 * Formula: Activity Data (tonne-km) x Emission Factor (kg CO2e / tonne-km)
 * Factor is fetched deterministically from the database.
 */
export async function calculateFreightScope3Emissions(params: {
  distanceKm: number;
  weightTonnes: number;
  transportMode: TransportMode;
  fuelType: FuelType;
}): Promise<Scope3CalculationResult> {
  const { distanceKm, weightTonnes, transportMode, fuelType } = params;

  if (distanceKm <= 0 || weightTonnes <= 0) {
    throw new Error("Deterministic calculation failed: Distance and weight must be positive numbers.");
  }

  // 1. Fetch factor from DB
  const factor = await prisma.emissionFactor.findFirst({
    where: {
      transportMode,
      fuelType,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const selectedFactor =
    factor ||
    (await prisma.emissionFactor.findFirst({
      where: { transportMode },
      orderBy: { createdAt: "desc" },
    }));

  if (!selectedFactor) {
    throw new Error(
      `Deterministic calculation failed: No emission factor registered in database for mode [${transportMode}] and fuel [${fuelType}].`
    );
  }

  const activityDataTonneKm = Number((distanceKm * weightTonnes).toFixed(4));
  const factorApplied = selectedFactor.factor;
  const totalKgCO2e = Number((activityDataTonneKm * factorApplied).toFixed(4));
  const totalTonnesCO2e = Number((totalKgCO2e / 1000).toFixed(4));

  const formulaUsed = `${distanceKm} km * ${weightTonnes} t * ${factorApplied} ${selectedFactor.unit}`;
  const auditLog = `Deterministically computed using ${selectedFactor.source} (${factorApplied} ${selectedFactor.unit}) for ${transportMode}/${fuelType}: ${activityDataTonneKm} t-km * ${factorApplied} = ${totalKgCO2e} kg CO2e`;

  return {
    activityDataTonneKm,
    emissionFactorId: selectedFactor.id,
    emissionFactorApplied: factorApplied,
    factorSource: selectedFactor.source,
    factorUnit: selectedFactor.unit,
    factorVersion: selectedFactor.version,
    totalKgCO2e,
    totalTonnesCO2e,
    formulaUsed,
    deterministicAuditLog: auditLog,
  };
}
