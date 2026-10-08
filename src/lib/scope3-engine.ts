import { prisma } from "./db";

export interface Scope3Input {
  cargoWeight_kg: number;
  freightDistance_km: number;
  transportMode: string;
  fuelType: string;
  region?: string;
  shipmentDate?: Date;
}

export interface Scope3Output {
  calculationId: string;
  activityData: {
    cargoWeight_kg: number;
    weight_tonnes: number;
    freightDistance_km: number;
    activityTonneKm: number;
  };
  emissionFactorId: string;
  factor: number;
  factorVersion: string;
  factorSource: string;
  formula: string;
  result: number; // kg CO2e
  unit: "kg_CO2e";
  calculatedAt: string;
}

/**
 * Pure deterministic Scope-3 function (Rule 3)
 * Formula: (cargoWeight_kg / 1000) * freightDistance_km * factor
 * Looked up from EmissionFactor table by mode/fuel/region with effective dates.
 * Same inputs always produce identical results.
 */
export async function calculateDeterministicScope3(input: Scope3Input): Promise<Scope3Output> {
  const {
    cargoWeight_kg,
    freightDistance_km,
    transportMode,
    fuelType,
    region = "EU",
    shipmentDate = new Date(),
  } = input;

  if (cargoWeight_kg <= 0 || freightDistance_km <= 0) {
    throw new Error("Scope-3 calculation requires positive cargo weight and distance.");
  }

  // Look up emission factor with effective dates check
  const factorRecord = await prisma.emissionFactor.findFirst({
    where: {
      transportMode,
      fuelType,
      region: { in: [region, "GLOBAL"] },
      effectiveFrom: { lte: shipmentDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: shipmentDate } }],
    },
    orderBy: [{ region: "asc" }, { createdAt: "desc" }],
  });

  // Fallback to transportMode general factor if specific fuel combo missing
  const selectedFactor =
    factorRecord ||
    (await prisma.emissionFactor.findFirst({
      where: { transportMode },
      orderBy: { createdAt: "desc" },
    }));

  if (!selectedFactor) {
    throw new Error(
      `No registered emission factor for transportMode [${transportMode}] and fuelType [${fuelType}].`
    );
  }

  const weight_tonnes = Number((cargoWeight_kg / 1000).toFixed(4));
  const activityTonneKm = Number((weight_tonnes * freightDistance_km).toFixed(4));
  const factorVal = selectedFactor.factor;
  const result = Number((activityTonneKm * factorVal).toFixed(4));

  const calculationId = `CALC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const formula = `(${cargoWeight_kg} kg / 1000) * ${freightDistance_km} km * ${factorVal} ${selectedFactor.unit} = ${activityTonneKm} t-km * ${factorVal}`;

  return {
    calculationId,
    activityData: {
      cargoWeight_kg,
      weight_tonnes,
      freightDistance_km,
      activityTonneKm,
    },
    emissionFactorId: selectedFactor.id,
    factor: factorVal,
    factorVersion: selectedFactor.version,
    factorSource: selectedFactor.source,
    formula,
    result,
    unit: "kg_CO2e",
    calculatedAt: new Date().toISOString(),
  };
}
