"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Sparkles,
  Truck,
  Ship,
  Plane,
  Train,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  Layers,
  Leaf,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SimulatorResult {
  shipment: any;
  activityData: {
    cargoWeight_kg: number;
    weightTonnes: number;
    freightDistance_km: number;
    activityTonneKm: number;
  };
  baseline: {
    transportMode: string;
    fuelType: string;
    factor: number;
    factorSource: string;
    formula: string;
    emissionsKg: number;
    emissionsTonnes: number;
  };
  scenario: {
    transportMode: string;
    fuelType: string;
    factor: number;
    factorSource: string;
    formula: string;
    emissionsKg: number;
    emissionsTonnes: number;
  };
  comparison: {
    deltaKg: number;
    savedKgCO2e: number;
    savedTonnesCO2e: number;
    percentReduction: number;
    isReduction: boolean;
    summary: string;
  };
}

const MODE_FUEL_OPTIONS: Record<string, string[]> = {
  ROAD: ["DIESEL", "ELECTRIC", "HYDROGEN"],
  RAIL: ["ELECTRIC", "DIESEL"],
  SEA: ["HEAVY_FUEL_OIL", "LNG"],
  AIR: ["JET_A1"],
};

export default function CarbonSimulatorPage() {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");
  const [customDistance, setCustomDistance] = useState<number>(1000);
  const [customWeight, setCustomWeight] = useState<number>(35); // Tonnes
  const [originalMode, setOriginalMode] = useState<string>("ROAD");
  const [originalFuel, setOriginalFuel] = useState<string>("DIESEL");
  const [scenarioMode, setScenarioMode] = useState<string>("RAIL");
  const [scenarioFuel, setScenarioFuel] = useState<string>("ELECTRIC");
  const [simulationResult, setSimulationResult] = useState<SimulatorResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Fetch real shipments from database
  const { data: shipmentsData } = useQuery({
    queryKey: ["shipments"],
    queryFn: async () => {
      const res = await fetch("/api/shipments");
      if (!res.ok) throw new Error("Failed to load shipments");
      return res.json();
    },
  });

  const shipments = shipmentsData?.shipments || [];

  // When a shipment is selected from DB, populate inputs
  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    const found = shipments.find((s: any) => s.id === id);
    if (found) {
      setCustomDistance(found.distanceKm);
      setCustomWeight(found.weightTonnes);
      setOriginalMode(found.transportMode);
      setOriginalFuel(found.fuelType);

      // Default scenario to a cleaner option
      if (found.transportMode === "ROAD") {
        setScenarioMode("ROAD");
        setScenarioFuel("ELECTRIC");
      } else if (found.transportMode === "AIR") {
        setScenarioMode("SEA");
        setScenarioFuel("LNG");
      } else {
        setScenarioMode("RAIL");
        setScenarioFuel("ELECTRIC");
      }
    }
  };

  const runSimulation = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch("/api/simulator/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: selectedShipmentId || undefined,
          cargoWeight_kg: customWeight * 1000,
          freightDistance_km: customDistance,
          originalMode,
          originalFuel,
          scenarioMode,
          scenarioFuel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed");
      }

      const result = await res.json();
      setSimulationResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  // Run initial simulation on mount or preset
  useEffect(() => {
    runSimulation();
  }, [originalMode, originalFuel, scenarioMode, scenarioFuel, customDistance, customWeight]);

  const applyPreset = (preset: {
    origMode: string;
    origFuel: string;
    scenMode: string;
    scenFuel: string;
    dist: number;
    weight: number;
  }) => {
    setSelectedShipmentId("");
    setOriginalMode(preset.origMode);
    setOriginalFuel(preset.origFuel);
    setScenarioMode(preset.scenMode);
    setScenarioFuel(preset.scenFuel);
    setCustomDistance(preset.dist);
    setCustomWeight(preset.weight);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "AIR":
        return <Plane className="h-4 w-4" />;
      case "SEA":
        return <Ship className="h-4 w-4" />;
      case "RAIL":
        return <Train className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase tracking-wider font-mono">
                Deterministic Scope-3 Engine
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">Phase 6 Advanced Module</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">What-If Carbon Scenario Simulator</h1>
            <p className="text-xs text-slate-400">
              Model modal shifts and alternative low-carbon fuels using the exact DEFRA 2024 emission factor database.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
              Deterministic Fidelity: 100%
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Strategic Decarbonization Presets:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <button
              onClick={() =>
                applyPreset({
                  origMode: "AIR",
                  origFuel: "JET_A1",
                  scenMode: "SEA",
                  scenFuel: "LNG",
                  dist: 4500,
                  weight: 20,
                })
              }
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-600 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
                <span>Air ✈️ → Sea 🚢</span>
                <span className="text-[10px] text-emerald-400 font-mono">-97.8%</span>
              </div>
              <p className="text-[10px] text-slate-400">Long-haul aviation freight to LNG container vessel.</p>
            </button>

            <button
              onClick={() =>
                applyPreset({
                  origMode: "ROAD",
                  origFuel: "DIESEL",
                  scenMode: "ROAD",
                  scenFuel: "ELECTRIC",
                  dist: 450,
                  weight: 38,
                })
              }
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-600 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
                <span>Diesel Road 🚛 → BEV ⚡</span>
                <span className="text-[10px] text-emerald-400 font-mono">-76.2%</span>
              </div>
              <p className="text-[10px] text-slate-400">Corridor fleet electrification to 40-tonne battery HGV.</p>
            </button>

            <button
              onClick={() =>
                applyPreset({
                  origMode: "ROAD",
                  origFuel: "DIESEL",
                  scenMode: "RAIL",
                  scenFuel: "ELECTRIC",
                  dist: 850,
                  weight: 42,
                })
              }
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-600 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
                <span>Road 🚛 → Electric Rail 🚆</span>
                <span className="text-[10px] text-emerald-400 font-mono">-86.6%</span>
              </div>
              <p className="text-[10px] text-slate-400">Intermodal rail freight shift along European corridors.</p>
            </button>

            <button
              onClick={() =>
                applyPreset({
                  origMode: "ROAD",
                  origFuel: "DIESEL",
                  scenMode: "ROAD",
                  scenFuel: "HYDROGEN",
                  dist: 600,
                  weight: 35,
                })
              }
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-600 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
                <span>Diesel 🚛 → Hydrogen 💧</span>
                <span className="text-[10px] text-emerald-400 font-mono">-83.6%</span>
              </div>
              <p className="text-[10px] text-slate-400">Fuel Cell Electric Vehicle (FCEV) zero-tailpipe transit.</p>
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Shipment Picker & Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <span>Consignment Parameters</span>
              </h3>

              {/* Real DB Shipment Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                  Select Existing Verified Shipment
                </label>
                <select
                  value={selectedShipmentId}
                  onChange={(e) => handleSelectShipment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="">-- Custom Parameters / Manual Scenario --</option>
                  {shipments.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.manifestId} ({s.supplier?.name} - {s.origin} → {s.destination})
                    </option>
                  ))}
                </select>
              </div>

              {/* Distance & Cargo Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                    Transit Distance (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customDistance}
                    onChange={(e) => setCustomDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                    Cargo Weight (Tonnes)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Current Transport Mode & Fuel */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Current Baseline (Active Manifest)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Mode</label>
                    <select
                      value={originalMode}
                      onChange={(e) => {
                        const m = e.target.value;
                        setOriginalMode(m);
                        setOriginalFuel(MODE_FUEL_OPTIONS[m][0]);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    >
                      {Object.keys(MODE_FUEL_OPTIONS).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Fuel / Powertrain</label>
                    <select
                      value={originalFuel}
                      onChange={(e) => setOriginalFuel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    >
                      {MODE_FUEL_OPTIONS[originalMode].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Simulated What-If Mode & Fuel */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-900/40 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block font-mono">
                  What-If Scenario Target
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Mode</label>
                    <select
                      value={scenarioMode}
                      onChange={(e) => {
                        const m = e.target.value;
                        setScenarioMode(m);
                        setScenarioFuel(MODE_FUEL_OPTIONS[m][0]);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono"
                    >
                      {Object.keys(MODE_FUEL_OPTIONS).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Fuel / Powertrain</label>
                    <select
                      value={scenarioFuel}
                      onChange={(e) => setScenarioFuel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono"
                    >
                      {MODE_FUEL_OPTIONS[scenarioMode].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Side-by-Side Simulation Results */}
          <div className="lg:col-span-7 space-y-4">
            {simulationResult && (
              <div className="space-y-4 animate-fadeIn">
                {/* Impact Delta Hero Card */}
                <div
                  className={`glass-panel p-6 rounded-2xl border ${
                    simulationResult.comparison.isReduction
                      ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-950"
                      : "border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">
                      Scope-3 Scenario Decarbonization Verdict
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black font-mono flex items-center space-x-1 ${
                        simulationResult.comparison.isReduction
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {simulationResult.comparison.isReduction ? (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 mr-1" />
                          <span>{simulationResult.comparison.percentReduction}% REDUCTION</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 mr-1" />
                          <span>+{Math.abs(simulationResult.comparison.percentReduction)}% EMISSIONS INCREASE</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline space-x-3">
                    <span className="text-4xl font-black text-white font-mono">
                      {simulationResult.comparison.isReduction
                        ? Math.abs(simulationResult.comparison.savedTonnesCO2e).toLocaleString()
                        : Math.abs(simulationResult.comparison.deltaKg / 1000).toLocaleString()}
                    </span>
                    <span className="text-sm font-mono text-slate-400">
                      tonnes CO₂e {simulationResult.comparison.isReduction ? "avoided" : "added"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 font-sans leading-relaxed">
                    {simulationResult.comparison.summary}
                  </p>
                </div>

                {/* Side-by-Side Detailed Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Baseline Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                        {getModeIcon(simulationResult.baseline.transportMode)}
                        <span>Current Baseline</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {simulationResult.baseline.transportMode} • {simulationResult.baseline.fuelType}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                        Calculated Footprint
                      </span>
                      <div className="text-2xl font-black text-white font-mono">
                        {simulationResult.baseline.emissionsKg.toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal"> kg CO₂e</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block">
                        ({simulationResult.baseline.emissionsTonnes} tonnes)
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-400">
                      <div className="flex justify-between">
                        <span>DEFRA Factor:</span>
                        <span className="text-slate-200">{simulationResult.baseline.factor} kg/t-km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Formula:</span>
                        <span className="text-slate-200">{simulationResult.baseline.formula}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800">
                        Source: {simulationResult.baseline.factorSource}
                      </div>
                    </div>
                  </div>

                  {/* Scenario Card */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                        {getModeIcon(simulationResult.scenario.transportMode)}
                        <span>What-If Scenario</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300">
                        {simulationResult.scenario.transportMode} • {simulationResult.scenario.fuelType}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                        Simulated Footprint
                      </span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">
                        {simulationResult.scenario.emissionsKg.toLocaleString()}
                        <span className="text-xs text-slate-400 font-normal"> kg CO₂e</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block">
                        ({simulationResult.scenario.emissionsTonnes} tonnes)
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] space-y-1 text-slate-400">
                      <div className="flex justify-between">
                        <span>DEFRA Factor:</span>
                        <span className="text-emerald-300">{simulationResult.scenario.factor} kg/t-km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Formula:</span>
                        <span className="text-emerald-300">{simulationResult.scenario.formula}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800">
                        Source: {simulationResult.scenario.factorSource}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit & Regulatory Assurance Footnote */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">
                      Deterministic Methodological Parity (Rule 3)
                    </span>
                    <p className="leading-relaxed">
                      All calculations utilize the identical immutable DEFRA 2024 emission factors and formulas enforced by the live pipeline. No artificial rounding or speculative estimations are applied.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
