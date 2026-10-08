"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  CloudRain,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function SupplierComparisonPage() {
  const [supplier1Id, setSupplier1Id] = useState<string>("");
  const [supplier2Id, setSupplier2Id] = useState<string>("");
  const [selectedDrawerId, setSelectedDrawerId] = useState<string | null>(null);

  // Fetch all suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to load suppliers");
      return res.json();
    },
  });

  const suppliers = suppliersData?.suppliers || [];

  // Set default suppliers when loaded
  React.useEffect(() => {
    if (suppliers.length >= 2 && !supplier1Id && !supplier2Id) {
      setSupplier1Id(suppliers[0].id);
      setSupplier2Id(suppliers[1].id);
    }
  }, [suppliers]);

  // Query details for Supplier 1
  const { data: s1Data } = useQuery({
    queryKey: ["supplier-compare", supplier1Id],
    queryFn: async () => {
      if (!supplier1Id) return null;
      const res = await fetch(`/api/suppliers/${supplier1Id}`);
      if (!res.ok) throw new Error("Failed to load supplier 1");
      return res.json();
    },
    enabled: !!supplier1Id,
  });

  // Query details for Supplier 2
  const { data: s2Data } = useQuery({
    queryKey: ["supplier-compare", supplier2Id],
    queryFn: async () => {
      if (!supplier2Id) return null;
      const res = await fetch(`/api/suppliers/${supplier2Id}`);
      if (!res.ok) throw new Error("Failed to load supplier 2");
      return res.json();
    },
    enabled: !!supplier2Id,
  });

  const s1 = s1Data?.supplier;
  const s2 = s2Data?.supplier;
  const s1Emissions = s1Data?.emissions;
  const s2Emissions = s2Data?.emissions;
  const s1Certs = s1Data?.certificates || [];
  const s2Certs = s2Data?.certificates || [];
  const s1Alerts = s1Data?.alerts || [];
  const s2Alerts = s2Data?.alerts || [];

  // Comparative winner determination
  const scoreDiff = (s1?.trustScore || 0) - (s2?.trustScore || 0);
  const preferredSupplier =
    scoreDiff > 0 ? s1 : scoreDiff < 0 ? s2 : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold uppercase tracking-wider font-mono interactive-badge">
                Benchmarking
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">Vendor Assessment</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Vendor Comparison</h1>
            <p className="text-xs text-slate-400">
              Side-by-side auditable evaluation of supplier integrity scores, emissions, and certifications.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 card-hover">
              <Scale className="h-4 w-4" />
              <span>Direct Benchmarking</span>
            </span>
          </div>
        </div>

        {/* Supplier Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Vendor A (Primary Subject)
            </label>
            <select
              value={supplier1Id}
              onChange={(e) => setSupplier1Id(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Tier {s.tier} • {s.country} • {s.trustScore} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Vendor B (Benchmark Counterpart)
            </label>
            <select
              value={supplier2Id}
              onChange={(e) => setSupplier2Id(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Tier {s.tier} • {s.country} • {s.trustScore} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparative Summary Verdict Banner */}
        {preferredSupplier && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono block">
                  Recommended Procurement Partner
                </span>
                <span className="text-sm font-black text-white">
                  {preferredSupplier.name} demonstrates superior ESG standing (+{Math.abs(scoreDiff).toFixed(1)} trust points).
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDrawerId(preferredSupplier.id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center space-x-1"
            >
              <span>View 360° Profile</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Detailed Side-by-Side Comparison Matrix */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Scale className="h-4 w-4 text-cyan-400" />
              <span>Comprehensive ESG Due Diligence Matrix</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">All Metrics DB-Grounded</span>
          </div>

          <div className="grid grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
            {/* Metric Labels Column */}
            <div className="col-span-12 md:col-span-4 p-5 space-y-5 bg-slate-950/40">
              <div className="h-14 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Corporate Identity
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Continuous Trust Score
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Compliance Standing
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Total Scope-3 Emissions
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Active Accreditations
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Open Forensic Alerts
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Audit Data Freshness
              </div>
              <div className="h-12 flex items-center text-xs font-bold text-slate-400">
                Direct Adjudication
              </div>
            </div>

            {/* Supplier 1 Column */}
            <div className="col-span-12 md:col-span-4 p-5 space-y-5 bg-slate-900/30">
              {s1 ? (
                <>
                  <div className="h-14 flex flex-col justify-center">
                    <span className="font-bold text-white text-sm truncate">{s1.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Tier {s1.tier} • {s1.country} ({s1.registrationNo})
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {s1.trustScore?.toFixed(1)}
                      <span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-200 border border-slate-700">
                      {s1.status}
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-lg font-black font-mono text-white">
                      {s1Emissions?.totalEmissionsTonnes ?? 0}
                      <span className="text-xs text-slate-400 font-normal"> t CO₂e</span>
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      {s1Certs.length} Accredited Cert(s)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className={`text-sm font-bold font-mono ${s1Alerts.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {s1Alerts.length} Flagged Finding(s)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-xs font-mono text-slate-300">
                      {s1Data?.freshness?.status || "FRESH"} ({s1Data?.freshness?.dataAgeDays ?? 0}d old)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <button
                      onClick={() => setSelectedDrawerId(s1.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center space-x-1"
                    >
                      <span>Open 360° Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">Loading vendor data...</div>
              )}
            </div>

            {/* Supplier 2 Column */}
            <div className="col-span-12 md:col-span-4 p-5 space-y-5 bg-slate-900/30">
              {s2 ? (
                <>
                  <div className="h-14 flex flex-col justify-center">
                    <span className="font-bold text-white text-sm truncate">{s2.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Tier {s2.tier} • {s2.country} ({s2.registrationNo})
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      {s2.trustScore?.toFixed(1)}
                      <span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-200 border border-slate-700">
                      {s2.status}
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-lg font-black font-mono text-white">
                      {s2Emissions?.totalEmissionsTonnes ?? 0}
                      <span className="text-xs text-slate-400 font-normal"> t CO₂e</span>
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      {s2Certs.length} Accredited Cert(s)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className={`text-sm font-bold font-mono ${s2Alerts.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {s2Alerts.length} Flagged Finding(s)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <span className="text-xs font-mono text-slate-300">
                      {s2Data?.freshness?.status || "FRESH"} ({s2Data?.freshness?.dataAgeDays ?? 0}d old)
                    </span>
                  </div>

                  <div className="h-12 flex items-center">
                    <button
                      onClick={() => setSelectedDrawerId(s2.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition flex items-center space-x-1"
                    >
                      <span>Open 360° Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500">Loading vendor data...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier 360 Drawer */}
      <Supplier360Drawer
        supplierId={selectedDrawerId}
        onClose={() => setSelectedDrawerId(null)}
      />
    </AppLayout>
  );
}
