"use client";

import React from "react";
import { CloudRain, ShieldCheck, AlertTriangle, Building2, TrendingDown } from "lucide-react";

interface MetricsOverviewProps {
  metrics?: {
    totalEmissionsKg: number;
    verifiedEmissionsKg: number;
    unverifiedOrFlaggedEmissionsKg: number;
    totalSuppliersCount: number;
    verifiedSuppliersCount: number;
    flaggedSuppliersCount: number;
    blacklistedCount: number;
    integrityRatePercent: number;
  };
  alertsCount: number;
}

export default function MetricsOverview({ metrics, alertsCount }: MetricsOverviewProps) {
  const totalEmissionsKg = metrics?.totalEmissionsKg || 0;
  const totalEmissionsTonnes = (totalEmissionsKg / 1000).toFixed(2);
  const verifiedEmissionsTonnes = ((metrics?.verifiedEmissionsKg || 0) / 1000).toFixed(2);
  const unverifiedEmissionsTonnes = ((metrics?.unverifiedOrFlaggedEmissionsKg || 0) / 1000).toFixed(2);
  const integrityRate = metrics?.integrityRatePercent ?? 100;
  const suppliersTotal = metrics?.totalSuppliersCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Scope-3 Footprint */}
      <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Scope-3 Emissions
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CloudRain className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black tracking-tight text-white">
            {totalEmissionsTonnes}
          </span>
          <span className="text-sm font-semibold text-slate-400">t CO₂e</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center space-x-1">
          <span className="text-emerald-400 font-semibold">{totalEmissionsKg.toLocaleString()}</span>
          <span>kg total calculated footprint</span>
        </p>
      </div>

      {/* 2. Verified vs Flagged Disclosures */}
      <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verified vs At-Risk
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black tracking-tight text-cyan-400">
            {verifiedEmissionsTonnes}
          </span>
          <span className="text-sm font-semibold text-slate-400">t Verified</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Unverified/At-Risk:</span>
          <span className="text-amber-400 font-bold">{unverifiedEmissionsTonnes} t CO₂e</span>
        </div>
      </div>

      {/* 3. Supplier Integrity Index */}
      <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Integrity Health Rate
          </span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black tracking-tight text-white">
            {integrityRate}%
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {metrics?.verifiedSuppliersCount || 0} / {suppliersTotal} Active
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Multi-tier suppliers meeting strict audit standards
        </p>
      </div>

      {/* 4. Active Compliance Anomalies */}
      <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Anomaly Flags
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black tracking-tight text-rose-400">
            {alertsCount}
          </span>
          <span className="text-xs font-semibold text-slate-400">Explainable Flags</span>
        </div>
        <div className="mt-2 flex items-center space-x-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium">
            {metrics?.blacklistedCount || 0} Blacklisted
          </span>
          <span className="text-slate-400">
            {metrics?.flaggedSuppliersCount || 0} In Review
          </span>
        </div>
      </div>
    </div>
  );
}
