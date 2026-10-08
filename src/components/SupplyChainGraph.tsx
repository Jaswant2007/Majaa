"use client";

import React, { useState } from "react";
import { Network, ShieldAlert, ShieldCheck, AlertCircle, Building, ArrowRight, ExternalLink } from "lucide-react";

interface SupplierNode {
  id: string;
  name: string;
  code: string;
  tier: number;
  country: string;
  industry: string;
  rating: string;
  score: number;
  status: string;
  isBlacklisted: boolean;
  totalScope3EmissionsKg: number;
  flaggedViolationsCount: number;
}

interface SupplyChainGraphProps {
  suppliers: SupplierNode[];
  onSelectSupplier?: (supplier: SupplierNode) => void;
}

export default function SupplyChainGraph({ suppliers, onSelectSupplier }: SupplyChainGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const tier1 = suppliers.filter((s) => s.tier === 1);
  const tier2 = suppliers.filter((s) => s.tier === 2);
  const tier3 = suppliers.filter((s) => s.tier === 3);

  const activeSupplier = suppliers.find((s) => s.id === selectedNodeId) || suppliers[0];

  const getStatusColor = (status: string, isBlacklisted: boolean) => {
    if (isBlacklisted || status === "BLACKLISTED") return "border-rose-500/80 bg-rose-950/40 text-rose-400";
    if (status === "REQUIRES_REVIEW" || status === "HIGH_RISK")
      return "border-amber-500/80 bg-amber-950/40 text-amber-400";
    return "border-emerald-500/80 bg-emerald-950/40 text-emerald-400";
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "A":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "B":
        return "bg-teal-500/20 text-teal-400 border-teal-500/40";
      case "C":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "D":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      default:
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Multi-Tier Supply Chain Topology & Integrity Map</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                Tier-3 $\rightarrow$ Tier-1 Lineage
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive ESG risk propagation graph across raw material, fabrication, and freight tiers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Verified</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-400">Requires Review</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Blacklisted</span>
          </div>
        </div>
      </div>

      {/* 3-Tier Multi-Column Flow Architecture */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Tier 3 Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">T3</span>
              <span>Raw Materials & Mining</span>
            </span>
            <span className="text-[11px] text-slate-400">{tier3.length} entities</span>
          </div>

          <div className="space-y-3">
            {tier3.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectSupplier?.(node);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  selectedNodeId === node.id
                    ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "hover:border-slate-600"
                } ${getStatusColor(node.status, node.isBlacklisted)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{node.code}</span>
                    <h3 className="font-bold text-sm text-white mt-0.5">{node.name}</h3>
                    <p className="text-[11px] text-slate-300 mt-1">{node.industry}</p>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded border ${getRatingBadge(
                      node.rating
                    )}`}
                  >
                    Grade {node.rating}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">ESG Score:</span>
                  <span className="font-bold text-white">{node.score} / 100</span>
                </div>

                {node.isBlacklisted && (
                  <div className="mt-2 text-[10px] font-semibold text-rose-300 flex items-center space-x-1 bg-rose-500/20 px-2 py-1 rounded">
                    <ShieldAlert className="h-3 w-3 shrink-0" />
                    <span>SANCTIONED ENTITY DETECTED</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2 Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">T2</span>
              <span>Fabrication & Heavy Freight</span>
            </span>
            <span className="text-[11px] text-slate-400">{tier2.length} entities</span>
          </div>

          <div className="space-y-3">
            {tier2.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectSupplier?.(node);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  selectedNodeId === node.id
                    ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "hover:border-slate-600"
                } ${getStatusColor(node.status, node.isBlacklisted)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{node.code}</span>
                    <h3 className="font-bold text-sm text-white mt-0.5">{node.name}</h3>
                    <p className="text-[11px] text-slate-300 mt-1">{node.industry}</p>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded border ${getRatingBadge(
                      node.rating
                    )}`}
                  >
                    Grade {node.rating}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Emissions:</span>
                  <span className="font-bold text-slate-200">
                    {(node.totalScope3EmissionsKg / 1000).toFixed(1)} t CO₂e
                  </span>
                </div>

                {node.flaggedViolationsCount > 0 && (
                  <div className="mt-2 text-[10px] font-semibold text-amber-300 flex items-center space-x-1 bg-amber-500/20 px-2 py-1 rounded">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{node.flaggedViolationsCount} Compliance Flag(s)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tier 1 Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">T1</span>
              <span>Final Assembly & Logistics 3PL</span>
            </span>
            <span className="text-[11px] text-slate-400">{tier1.length} entities</span>
          </div>

          <div className="space-y-3">
            {tier1.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectSupplier?.(node);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  selectedNodeId === node.id
                    ? "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "hover:border-slate-600"
                } ${getStatusColor(node.status, node.isBlacklisted)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{node.code}</span>
                    <h3 className="font-bold text-sm text-white mt-0.5">{node.name}</h3>
                    <p className="text-[11px] text-slate-300 mt-1">{node.industry}</p>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded border ${getRatingBadge(
                      node.rating
                    )}`}
                  >
                    Grade {node.rating}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Verified Scope-3:</span>
                  <span className="font-bold text-emerald-400">
                    {(node.totalScope3EmissionsKg / 1000).toFixed(1)} t CO₂e
                  </span>
                </div>

                <div className="mt-2 text-[10px] font-semibold text-emerald-300 flex items-center space-x-1 bg-emerald-500/20 px-2 py-1 rounded">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span>ISO-14064 AUDIT VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Entity Drilldown Inspector */}
      {activeSupplier && (
        <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">{activeSupplier.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {activeSupplier.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                  Tier {activeSupplier.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSupplier.country} • {activeSupplier.industry} • Rating Grade {activeSupplier.rating} (
                {activeSupplier.score}/100)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400">Scope-3 Footprint:</span>
              <p className="font-bold text-white text-sm">
                {(activeSupplier.totalScope3EmissionsKg / 1000).toFixed(2)} tonnes CO₂e
              </p>
            </div>
            <button
              onClick={() => onSelectSupplier?.(activeSupplier)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition flex items-center space-x-1"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
