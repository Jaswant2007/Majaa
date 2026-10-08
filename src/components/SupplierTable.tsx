"use client";

import React, { useState } from "react";
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
} from "lucide-react";

interface SupplierRecord {
  id: string;
  name: string;
  code: string;
  tier: number;
  country: string;
  industry: string;
  contactEmail: string;
  rating: string;
  score: number;
  status: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  totalScope3EmissionsKg: number;
  verifiedEmissionsKg: number;
  flaggedViolationsCount: number;
  certificates?: any[];
  alerts?: any[];
}

interface SupplierTableProps {
  suppliers: SupplierRecord[];
  onSelectSupplier?: (s: SupplierRecord) => void;
}

export default function SupplierTable({ suppliers, onSelectSupplier }: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<number | "ALL">("ALL");

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || s.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getStatusBadge = (status: string, isBlacklisted: boolean) => {
    if (isBlacklisted || status === "BLACKLISTED") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>BLACKLISTED</span>
        </span>
      );
    }
    if (status === "HIGH_RISK") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>HIGH RISK</span>
        </span>
      );
    }
    if (status === "REQUIRES_REVIEW") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>REQUIRES REVIEW</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>VERIFIED</span>
      </span>
    );
  };

  const getGradeBadge = (rating: string) => {
    const colors: Record<string, string> = {
      A: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      B: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      D: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      F: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    };
    return colors[rating] || colors.F;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden card-hover">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Vendor Registry</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {filteredSuppliers.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live multi-tier vendor integrity ratings and compliance statuses.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTierFilter("ALL")}
              className={`px-2.5 py-1 rounded ${
                tierFilter === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTierFilter(1)}
              className={`px-2.5 py-1 rounded ${
                tierFilter === 1 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tier 1
            </button>
            <button
              onClick={() => setTierFilter(2)}
              className={`px-2.5 py-1 rounded ${
                tierFilter === 2 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tier 2
            </button>
            <button
              onClick={() => setTierFilter(3)}
              className={`px-2.5 py-1 rounded ${
                tierFilter === 3 ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tier 3
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-5">Supplier Entity</th>
              <th className="py-3.5 px-4">Tier</th>
              <th className="py-3.5 px-4">Compliance Status</th>
              <th className="py-3.5 px-4">ESG Rating & Score</th>
              <th className="py-3.5 px-4">Calculated Scope-3</th>
              <th className="py-3.5 px-4">Violations</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSuppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="hover:bg-slate-900/40 transition group cursor-pointer"
                onClick={() => onSelectSupplier?.(supplier)}
              >
                <td className="py-4 px-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                      {supplier.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {supplier.code} • {supplier.country}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded font-bold font-mono text-[11px] bg-slate-800 text-slate-300">
                    Tier {supplier.tier}
                  </span>
                </td>

                <td className="py-4 px-4">{getStatusBadge(supplier.status, supplier.isBlacklisted)}</td>

                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`h-6 w-6 rounded flex items-center justify-center font-black text-xs border ${getGradeBadge(
                        supplier.rating
                      )}`}
                    >
                      {supplier.rating}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{supplier.score} / 100</span>
                      <span className="text-[10px] text-slate-400">Integrity Index</span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-200">
                      {(supplier.totalScope3EmissionsKg / 1000).toFixed(2)} t CO₂e
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      {(supplier.verifiedEmissionsKg / 1000).toFixed(2)} t Verified
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  {supplier.flaggedViolationsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {supplier.flaggedViolationsCount} Flagged
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      <span>Zero Flags</span>
                    </span>
                  )}
                </td>

                <td className="py-4 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSupplier?.(supplier);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-emerald-400 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
