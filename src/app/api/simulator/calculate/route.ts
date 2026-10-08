import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateDeterministicScope3 } from "@/lib/scope3-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      shipmentId,
      cargoWeight_kg,
      freightDistance_km,
      originalMode,
      originalFuel,
      scenarioMode,
      scenarioFuel,
      region = "EU",
    } = body;

    let shipmentRecord: any = null;

    if (shipmentId) {
      shipmentRecord = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          calculations: true,
          supplier: { select: { id: true, name: true, tier: true } },
        },
      });

      if (!shipmentRecord) {
        return NextResponse.json(
          { error: `Shipment ${shipmentId} not found.` },
          { status: 404 }
        );
      }

      cargoWeight_kg = shipmentRecord.weightTonnes * 1000;
      freightDistance_km = shipmentRecord.distanceKm;
      originalMode = shipmentRecord.transportMode;
      originalFuel = shipmentRecord.fuelType;
    }

    if (!cargoWeight_kg || !freightDistance_km || !originalMode || !originalFuel || !scenarioMode || !scenarioFuel) {
      return NextResponse.json(
        {
          error:
            "Missing parameters: cargoWeight_kg, freightDistance_km, originalMode, originalFuel, scenarioMode, and scenarioFuel are required.",
        },
        { status: 400 }
      );
    }

    // Baseline calculation using deterministic engine
    const baselineCalc = await calculateDeterministicScope3({
      cargoWeight_kg: Number(cargoWeight_kg),
      freightDistance_km: Number(freightDistance_km),
      transportMode: originalMode,
      fuelType: originalFuel,
      region,
    });

    // What-if scenario calculation using the exact SAME deterministic engine + DB factors
    const scenarioCalc = await calculateDeterministicScope3({
      cargoWeight_kg: Number(cargoWeight_kg),
      freightDistance_km: Number(freightDistance_km),
      transportMode: scenarioMode,
      fuelType: scenarioFuel,
      region,
    });

    const baselineKg = baselineCalc.result;
    const scenarioKg = scenarioCalc.result;
    const deltaKg = scenarioKg - baselineKg;
    const savedKg = baselineKg - scenarioKg;
    const percentReduction = Number(
      (((baselineKg - scenarioKg) / baselineKg) * 100).toFixed(1)
    );

    return NextResponse.json({
      shipment: shipmentRecord
        ? {
            id: shipmentRecord.id,
            manifestId: shipmentRecord.manifestId,
            supplier: shipmentRecord.supplier,
            origin: shipmentRecord.origin,
            destination: shipmentRecord.destination,
          }
        : null,
      activityData: {
        cargoWeight_kg: Number(cargoWeight_kg),
        weightTonnes: Number(cargoWeight_kg) / 1000,
        freightDistance_km: Number(freightDistance_km),
        activityTonneKm: (Number(cargoWeight_kg) / 1000) * Number(freightDistance_km),
      },
      baseline: {
        transportMode: originalMode,
        fuelType: originalFuel,
        factor: baselineCalc.factor,
        factorSource: baselineCalc.factorSource,
        formula: baselineCalc.formula,
        emissionsKg: Math.round(baselineKg * 100) / 100,
        emissionsTonnes: Number((baselineKg / 1000).toFixed(3)),
      },
      scenario: {
        transportMode: scenarioMode,
        fuelType: scenarioFuel,
        factor: scenarioCalc.factor,
        factorSource: scenarioCalc.factorSource,
        formula: scenarioCalc.formula,
        emissionsKg: Math.round(scenarioKg * 100) / 100,
        emissionsTonnes: Number((scenarioKg / 1000).toFixed(3)),
      },
      comparison: {
        deltaKg: Math.round(deltaKg * 100) / 100,
        savedKgCO2e: Math.round(savedKg * 100) / 100,
        savedTonnesCO2e: Number((savedKg / 1000).toFixed(3)),
        percentReduction,
        isReduction: percentReduction > 0,
        summary:
          percentReduction > 0
            ? `Shifting from ${originalMode} (${originalFuel}) to ${scenarioMode} (${scenarioFuel}) eliminates ${Math.abs(
                percentReduction
              )}% of Scope-3 emissions (${(savedKg / 1000).toFixed(2)} t CO₂e saved).`
            : `Scenario increases Scope-3 carbon by ${Math.abs(
                percentReduction
              )}% (+${(Math.abs(deltaKg) / 1000).toFixed(2)} t CO₂e).`,
      },
    });
  } catch (error: any) {
    console.error("Carbon Simulator error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to calculate simulation." },
      { status: 500 }
    );
  }
}
