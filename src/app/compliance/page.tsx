"use client";

import React, { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Award,
  AlertCircle,
  FileX,
  ExternalLink,
  Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ComplianceTab =
  | "ALL"
  | "TIMELINE"
  | "COMPLIANT"
  | "ACTION_REQUIRED"
  | "HIGH_RISK"
  | "EXPIRED"
  | "EXPIRING"
  | "MISSING"
  | "FAILED_CHECKS";

export default function ComplianceCenterPage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to load compliance data");
      return res.json();
    },
  });

  const suppliers = data?.suppliers || [];

  // Extract all certificates and map supplier details
  const allCertificates = useMemo(() => {
    const list: any[] = [];
    suppliers.forEach((s: any) => {
      (s.certificates || []).forEach((c: any) => {
        const now = new Date();
        const expiry = new Date(c.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        list.push({
          ...c,
          daysLeft,
          supplier: { id: s.id, name: s.name, registrationNo: s.registrationNo, tier: s.tier },
        });
      });
    });
    return list;
  }, [suppliers]);

  // Predictive Expiry Timeline Buckets (Next 30 / 60 / 90 Days)
  const timelineBuckets = useMemo(() => {
    const expired: any[] = [];
    const critical30: any[] = [];
    const warning60: any[] = [];
    const watchlist90: any[] = [];
    const stable: any[] = [];

    allCertificates.forEach((c: any) => {
      if (c.daysLeft <= 0 || c.status === "EXPIRED") {
        expired.push(c);
      } else if (c.daysLeft <= 30) {
        critical30.push(c);
      } else if (c.daysLeft <= 60) {
        warning60.push(c);
      } else if (c.daysLeft <= 90) {
        watchlist90.push(c);
      } else {
        stable.push(c);
      }
    });

    return { expired, critical30, warning60, watchlist90, stable };
  }, [allCertificates]);

  // Extract all alerts / failed checks
  const allFailedChecks = useMemo(() => {
    const list: any[] = [];
    suppliers.forEach((s: any) => {
      (s.alerts || []).forEach((a: any) => {
        list.push({
          ...a,
          supplier: { id: s.id, name: s.name, registrationNo: s.registrationNo, tier: s.tier },
        });
      });
    });
    return list;
  }, [suppliers]);

  // Determine supplier compliance status
  const getSupplierComplianceCategory = (s: any): string => {
    if (s.blacklisted || s.trustScore < 50 || s.status === "BLACKLISTED" || s.status === "HIGH_RISK") {
      return "HIGH_RISK";
    }
    if ((s.certificates || []).some((c: any) => c.status === "EXPIRED")) {
      return "EXPIRED";
    }
    if (
      s.status === "REQUIRES_REVIEW" ||
      s.trustScore < 75 ||
      (s.alerts || []).some((a: any) => a.status === "OPEN" && a.severity === "WARNING")
    ) {
      return "ACTION_REQUIRED";
    }
    return "COMPLIANT";
  };

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s: any) => {
      const category = getSupplierComplianceCategory(s);

      if (activeTab === "COMPLIANT" && category !== "COMPLIANT") return false;
      if (activeTab === "ACTION_REQUIRED" && category !== "ACTION_REQUIRED") return false;
      if (activeTab === "HIGH_RISK" && category !== "HIGH_RISK") return false;
      if (activeTab === "EXPIRED" && category !== "EXPIRED") return false;
      if (
        activeTab === "EXPIRING" &&
        !(s.certificates || []).some((c: any) => c.status === "EXPIRING_SOON" || c.daysLeft <= 30)
      ) {
        return false;
      }
      if (activeTab === "MISSING" && (s.certificates || []).length > 0) return false;
      if (activeTab === "FAILED_CHECKS" && (s.alerts || []).length === 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.registrationNo.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [suppliers, activeTab, searchQuery]);

  // Tab count stats
  const counts = useMemo(() => {
    return {
      ALL: suppliers.length,
      COMPLIANT: suppliers.filter((s: any) => getSupplierComplianceCategory(s) === "COMPLIANT").length,
      ACTION_REQUIRED: suppliers.filter((s: any) => getSupplierComplianceCategory(s) === "ACTION_REQUIRED").length,
      HIGH_RISK: suppliers.filter((s: any) => getSupplierComplianceCategory(s) === "HIGH_RISK").length,
      EXPIRED: suppliers.filter((s: any) => getSupplierComplianceCategory(s) === "EXPIRED").length,
      EXPIRING: allCertificates.filter((c: any) => c.status === "EXPIRING_SOON" || (c.daysLeft > 0 && c.daysLeft <= 30)).length,
      MISSING: suppliers.filter((s: any) => (s.certificates || []).length === 0).length,
      FAILED_CHECKS: allFailedChecks.length,
    };
  }, [suppliers, allCertificates, allFailedChecks]);

  const getComplianceBadge = (category: string) => {
    switch (category) {
      case "COMPLIANT":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "ACTION_REQUIRED":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "HIGH_RISK":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "EXPIRED":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold uppercase tracking-wider interactive-badge font-mono">
              Due Diligence
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">CSRD & ISO-14064</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Compliance</h1>
          <p className="text-xs text-slate-400">
            Real-time compliance monitoring across CSRD, ISO-14064, and due diligence standards.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 card-hover">
            Verified Vendors: <strong className="text-emerald-400">{counts.COMPLIANT}</strong> / {counts.ALL}
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3 card-hover">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Vendors", count: counts.ALL },
            {
              id: "TIMELINE",
              label: "Expiry Timeline",
              count:
                timelineBuckets.critical30.length +
                timelineBuckets.warning60.length +
                timelineBuckets.watchlist90.length,
            },
            { id: "COMPLIANT", label: "Compliant", count: counts.COMPLIANT },
            { id: "ACTION_REQUIRED", label: "Action Needed", count: counts.ACTION_REQUIRED },
            { id: "HIGH_RISK", label: "High Risk", count: counts.HIGH_RISK },
            { id: "EXPIRED", label: "Expired", count: counts.EXPIRED },
            { id: "EXPIRING", label: "Expiring Soon", count: counts.EXPIRING },
            { id: "MISSING", label: "Missing Certs", count: counts.MISSING },
            { id: "FAILED_CHECKS", label: "Failed Checks", count: counts.FAILED_CHECKS },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComplianceTab)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition whitespace-nowrap border hover:scale-[1.02] ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-slate-950 border-emerald-500 font-black shadow-md shadow-emerald-950/40"
                  : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id ? "bg-slate-950 text-emerald-400" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, registration code, country..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* PREDICTIVE TIMELINE VIEW (When TIMELINE tab is active) */}
      {activeTab === "TIMELINE" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Predictive Certificate Expiry Timeline Horizon</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Forecasted validity status across 30, 60, and 90-day intervals to prevent CSRD Scope-3 reporting gaps.
              </p>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                Critical (0-30d): {timelineBuckets.critical30.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                Warning (31-60d): {timelineBuckets.warning60.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Watchlist (61-90d): {timelineBuckets.watchlist90.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 0-30 Days Column: Critical */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-rose-300 uppercase font-mono">0 – 30 Days (Critical)</span>
                </div>
                <span className="text-[10px] font-mono text-rose-400 font-bold">
                  {timelineBuckets.critical30.length} Credential(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Imminent lapse will disqualify freight data from verified Scope-3 assurance under CSRD.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timelineBuckets.critical30.length === 0 ? (
                  <div className="p-4 text-center text-xs text-emerald-400 font-mono">
                    ✓ No certificates expiring in next 30 days.
                  </div>
                ) : (
                  timelineBuckets.critical30.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedSupplierId(c.supplier.id)}
                      className="p-3 rounded-xl bg-slate-950 border border-rose-900/40 hover:border-rose-500/60 transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{c.number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300">
                          {c.daysLeft}d left
                        </span>
                      </div>
                      <span className="text-[11px] text-cyan-400 font-mono block">{c.type} • {c.issuer}</span>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>{c.supplier.name} (Tier {c.supplier.tier})</span>
                        <span className="text-rose-400 font-bold">Action Required</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 31-60 Days Column: Warning */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-300 uppercase font-mono">31 – 60 Days (Warning)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {timelineBuckets.warning60.length} Credential(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Renewal documentation should be initiated with certifying authority this cycle.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timelineBuckets.warning60.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">
                    Zero certificates expiring in 31-60d window.
                  </div>
                ) : (
                  timelineBuckets.warning60.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedSupplierId(c.supplier.id)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{c.number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300">
                          {c.daysLeft}d left
                        </span>
                      </div>
                      <span className="text-[11px] text-cyan-400 font-mono block">{c.type} • {c.issuer}</span>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>{c.supplier.name} (Tier {c.supplier.tier})</span>
                        <span className="text-amber-400 font-mono">Initiate Outreach</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 61-90 Days Column: Watchlist */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-900/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  <span className="text-xs font-bold text-cyan-300 uppercase font-mono">61 – 90 Days (Watchlist)</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {timelineBuckets.watchlist90.length} Credential(s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Quarterly audit horizon. Scheduled for automated email reminders.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timelineBuckets.watchlist90.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">
                    Zero certificates in 61-90d watchlist.
                  </div>
                ) : (
                  timelineBuckets.watchlist90.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedSupplierId(c.supplier.id)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{c.number}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300">
                          {c.daysLeft}d left
                        </span>
                      </div>
                      <span className="text-[11px] text-cyan-400 font-mono block">{c.type} • {c.issuer}</span>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>{c.supplier.name} (Tier {c.supplier.tier})</span>
                        <span className="text-cyan-400 font-mono">Monitored</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Compliance Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Supplier Compliance Directory ({filteredSuppliers.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Continuous Audit Evaluation</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading compliance data...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No supplier records match the selected compliance criteria ({activeTab}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/40">
                  <th className="py-3 px-4">Supplier Entity</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4">Primary Credential</th>
                  <th className="py-3 px-4">Open Anomalies</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSuppliers.map((s: any) => {
                  const category = getSupplierComplianceCategory(s);
                  const cert = (s.certificates || [])[0];

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplierId(s.id)}
                      className="hover:bg-slate-900/50 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white text-xs block font-sans">{s.name}</span>
                        <span className="text-[10px] text-slate-400">{s.registrationNo} • {s.country}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300">
                          Tier {s.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getComplianceBadge(category)}`}>
                          {category.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        <span className={s.trustScore >= 80 ? "text-emerald-400" : s.trustScore >= 60 ? "text-amber-400" : "text-rose-400"}>
                          {s.trustScore?.toFixed(1)} / 100
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {cert ? (
                          <div>
                            <span className="font-bold text-white block text-[11px]">{cert.type}</span>
                            <span className="text-[10px] text-slate-400">Exp: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">None Registered</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {(s.alerts || []).length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            {(s.alerts || []).length} FLAGGED
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">Clean (0)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplierId(s.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] transition inline-flex items-center space-x-1"
                        >
                          <span>View 360°</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplier 360 Drawer */}
      <Supplier360Drawer
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </AppLayout>
  );
}
