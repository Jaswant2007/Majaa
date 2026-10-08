"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  ShieldAlert,
  AlertTriangle,
  Fingerprint,
  FileX,
  Share2,
  ExternalLink,
  Layers,
  Search,
  CheckCircle2,
  AlertOctagon,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function FraudInvestigationCenterPage() {
  const [activeTab, setActiveTab] = useState<"clusters" | "hashes" | "certs" | "alerts">("clusters");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fraud-analysis"],
    queryFn: async () => {
      const res = await fetch("/api/fraud/analysis");
      if (!res.ok) throw new Error("Failed to load fraud analysis");
      return res.json();
    },
  });

  const summary = data?.summary;
  const duplicateHashCases = data?.duplicateHashCases || [];
  const certReuseCases = data?.certReuseCases || [];
  const fraudAlerts = data?.fraudAlerts || [];
  const collusionClusters = data?.collusionClusters || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold uppercase tracking-wider font-mono">
                Counter-Fraud Forensics
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">Phase 6 Security Center</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Fraud & Collusion Investigation Center</h1>
            <p className="text-xs text-slate-400">
              Automated detection of cross-supplier document cloning, recycled environmental certificates, and shell company bypass attempts.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span>Zero-Trust Forensic Ledger</span>
            </span>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="glass-panel p-4 rounded-xl border border-rose-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cross-Entity Duplicates</span>
              <Fingerprint className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {summary?.crossSupplierCollusionCases ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Shared SHA-256 digests across separate vendors.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-amber-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Recycled Credentials</span>
              <FileX className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {summary?.reusedCertificatesCount ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Identical cert IDs claimed by multiple vendors.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-rose-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Critical Fraud Flags</span>
              <AlertOctagon className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {summary?.criticalFraudAlertsCount ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Identity mismatches & sanctions watchlist matches.
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-cyan-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Tamper Evidence</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              100%
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              All events immutably chained in append-only ledger.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab("clusters")}
            className={`px-3 py-2 font-bold rounded-xl transition whitespace-nowrap border ${activeTab === "clusters"
                ? "bg-rose-600 text-slate-950 border-rose-500 font-black shadow-md shadow-rose-950/40"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
          >
            <span>Collusion Clusters ({collusionClusters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hashes")}
            className={`px-3 py-2 font-bold rounded-xl transition whitespace-nowrap border ${activeTab === "hashes"
                ? "bg-rose-600 text-slate-950 border-rose-500 font-black shadow-md shadow-rose-950/40"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
          >
            <span>Duplicate SHA-256 Digests ({duplicateHashCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("certs")}
            className={`px-3 py-2 font-bold rounded-xl transition whitespace-nowrap border ${activeTab === "certs"
                ? "bg-rose-600 text-slate-950 border-rose-500 font-black shadow-md shadow-rose-950/40"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
          >
            <span>Certificate Reuse ({certReuseCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3 py-2 font-bold rounded-xl transition whitespace-nowrap border ${activeTab === "alerts"
                ? "bg-rose-600 text-slate-950 border-rose-500 font-black shadow-md shadow-rose-950/40"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
          >
            <span>Forensic Alerts ({fraudAlerts.length})</span>
          </button>
        </div>

        {/* TAB 1: COLLUSION CLUSTERS */}
        {activeTab === "clusters" && (
          <div className="space-y-4">
            {collusionClusters.length === 0 ? (
              <div className="glass-panel p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <span className="text-white font-bold block mb-1">Zero Cross-Supplier Collusion Networks Detected</span>
                <span>No distinct suppliers currently share duplicate cryptographic payload hashes.</span>
              </div>
            ) : (
              collusionClusters.map((cluster: any) => (
                <div key={cluster.id} className="glass-panel p-5 rounded-2xl border border-rose-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {cluster.severity}
                      </span>
                      <h4 className="font-bold text-white text-sm">{cluster.title}</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{cluster.id}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans">{cluster.evidence}</p>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                      Involved Commercial Entities
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cluster.affectedSuppliers.map((s: any) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSupplierId(s.id)}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{s.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">Tier {s.tier} • {s.registrationNo}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-cyan-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: DUPLICATE SHA-256 HASHES */}
        {activeTab === "hashes" && (
          <div className="space-y-4">
            {duplicateHashCases.length === 0 ? (
              <div className="glass-panel p-12 text-center text-xs text-slate-400">
                Zero duplicate hashes detected in repository.
              </div>
            ) : (
              duplicateHashCases.map((c: any) => (
                <div key={c.sha256Hash} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{c.filename}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-mono text-[11px] text-slate-400 break-all">
                          SHA-256: {c.sha256Hash}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.sha256Hash)}
                          className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                          title="Copy Hash"
                        >
                          {copiedHash === c.sha256Hash ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {c.totalOccurrences} Ingestions ({c.uniqueSuppliersCount} Vendor{c.uniqueSuppliersCount > 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">
                      Ingestion History Trace:
                    </span>
                    <div className="space-y-1.5">
                      {c.documents.map((d: any) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex justify-between items-center font-mono"
                        >
                          <div>
                            <span className="font-bold text-white">{d.supplier?.name}</span>
                            <span className="text-slate-500 text-[10px] ml-2">
                              v{d.version} • {new Date(d.uploadedAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedSupplierId(d.supplier?.id)}
                            className="text-cyan-400 hover:underline text-[11px] flex items-center space-x-1"
                          >
                            <span>Inspect Vendor</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CERTIFICATE REUSE */}
        {activeTab === "certs" && (
          <div className="space-y-4">
            {certReuseCases.length === 0 ? (
              <div className="glass-panel p-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <span>Zero hijacked or cross-vendor certificate reuses detected.</span>
              </div>
            ) : (
              certReuseCases.map((c: any) => (
                <div key={c.certificateNumber} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-white text-sm">{c.certificateNumber}</span>
                      <span className="text-xs text-slate-400 block font-mono">
                        Standard: {c.type} • Issuer: {c.issuer}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Reused Across {c.suppliers.length} Supplier Accounts
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {c.suppliers.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-white">{sub.supplier?.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 ml-2">
                            ({sub.supplier?.registrationNo})
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          Status: {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: FORENSIC ALERTS */}
        {activeTab === "alerts" && (
          <div className="space-y-3">
            {fraudAlerts.map((a: any) => (
              <div key={a.id} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {a.type}
                    </span>
                    <span className="font-bold text-white">{a.supplier?.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-slate-300 leading-relaxed font-sans">{a.whatHappened}</p>
                <p className="text-slate-400 text-[11px] font-sans">{a.whyItMatters}</p>

                {a.recommendedAction && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
                    <strong className="text-slate-400 uppercase text-[10px] block">Direct Directive:</strong>
                    {a.recommendedAction}
                  </div>
                )}
              </div>
            ))}
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
