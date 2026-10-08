"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  CloudRain,
  FileText,
  Truck,
  History,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Hash,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface Supplier360DrawerProps {
  supplierId: string | null;
  onClose: () => void;
}

export default function Supplier360Drawer({ supplierId, onClose }: Supplier360DrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "certs" | "emissions" | "documents" | "alerts" | "audit">("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-360", supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      const res = await fetch(`/api/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Failed to load supplier profile");
      return res.json();
    },
    enabled: !!supplierId,
  });

  if (!supplierId) return null;

  const supplier = data?.supplier;
  const risk = data?.riskAnalysis;
  const emissions = data?.emissions;
  const certs = data?.certificates || [];
  const docs = data?.documents || [];
  const shipments = data?.shipments || [];
  const alerts = data?.alerts || [];
  const auditTrail = data?.auditTrail || [];
  const executiveActions = data?.executiveActions || data?.recommendedActions || [];
  const freshness = data?.freshness || supplier?.freshness;

  const getFreshnessBadge = (freshInfo: any) => {
    if (!freshInfo) return null;
    const status = freshInfo.status;
    const ageDays = freshInfo.ageDays ?? 0;
    if (status === "FRESH") {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
          FRESH ({ageDays}d)
        </span>
      );
    } else if (status === "AGING") {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
          AGING ({ageDays}d)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-bold font-mono">
          STALE ({ageDays}d)
        </span>
      );
    }
  };

  const getStatusBadge = (status: string, blacklisted: boolean) => {
    if (blacklisted) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
          BLACKLISTED
        </span>
      );
    }
    switch (status) {
      case "VERIFIED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
            VERIFIED
          </span>
        );
      case "HIGH_RISK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
            HIGH RISK
          </span>
        );
      case "REQUIRES_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
            ACTION REQUIRED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase font-mono">
                Tier {supplier?.tier || 1} Supplier
              </span>
              {getFreshnessBadge(freshness)}
            </div>
            <h2 className="text-xl font-black text-white">{supplier?.name || "Loading..."}</h2>
            <p className="text-xs text-slate-400 font-mono">
              Reg: {supplier?.registrationNo} • {supplier?.country}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {supplier && getStatusBadge(supplier.status, supplier.blacklisted)}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <Building2 className="h-8 w-8 text-slate-600 animate-pulse mb-3" />
            <span>Loading 360-degree supplier profile...</span>
          </div>
        ) : (
          <div className="flex-1 p-6 space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 card-hover">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trust Score</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {supplier?.trustScore?.toFixed(1) || 0}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 card-hover">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scope-3 Footprint</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {emissions?.totalEmissionsTonnes || 0}
                  <span className="text-xs text-slate-500 font-normal"> t CO₂e</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 card-hover">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Certifications</span>
                <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                  {certs.length}
                  <span className="text-xs text-slate-500 font-normal"> Active</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 card-hover">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Data Freshness</span>
                <div className="mt-1 flex items-baseline space-x-1.5">
                  <span className={`text-2xl font-black font-mono ${
                    freshness?.status === "STALE" ? "text-rose-400" :
                    freshness?.status === "AGING" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {freshness?.ageDays ?? supplier?.daysSinceAudit ?? 0}d
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">
                    ({freshness?.status || "FRESH"})
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "overview" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Risk Analysis
              </button>
              <button
                onClick={() => setActiveTab("certs")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "certs" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Certificates ({certs.length})
              </button>
              <button
                onClick={() => setActiveTab("emissions")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "emissions" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Emissions & Shipments ({shipments.length})
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "documents" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Documents ({docs.length})
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "alerts" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Forensic Alerts ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`px-3 py-2 font-bold rounded-lg transition whitespace-nowrap ${
                  activeTab === "audit" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Audit Trail ({auditTrail.length})
              </button>
            </div>

            {/* TAB: OVERVIEW / RISK ANALYSIS */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Explainable Risk Assessment */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span>Explainable Risk Assessment Model (Rule 5)</span>
                  </h4>
                  <p className="text-xs text-white leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    {risk?.explanation}
                  </p>

                  {risk?.breakdown && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">6-Weight Score Breakdown:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(risk.breakdown).map(([key, val]: [string, any]) => (
                          <div key={key} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex justify-between font-mono">
                            <span className="text-slate-400 capitalize">{key}:</span>
                            <span className="text-white font-bold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Compliance Actions (Executive Action Engine) */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>Executive Action Engine Directives</span>
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      Rule-Based Governance
                    </span>
                  </div>
                  <div className="space-y-2">
                    {executiveActions.length === 0 ? (
                      <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-emerald-400 font-mono">
                        ✓ All automated compliance checks passed. No executive intervention required.
                      </div>
                    ) : (
                      executiveActions.map((action: any, i: number) => {
                        const isObj = typeof action === "object" && action !== null;
                        const title = isObj ? action.title : action;
                        const priority = isObj ? action.priority : "MEDIUM";
                        const reason = isObj ? action.reason : null;
                        const desc = isObj ? action.description : null;
                        const type = isObj ? action.type : null;

                        const priorityBadge =
                          priority === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : priority === "HIGH"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : priority === "LOW"
                            ? "bg-slate-700 text-slate-300 border-slate-600"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";

                        return (
                          <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${priorityBadge}`}>
                                  {priority}
                                </span>
                                {type && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {type}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-cyan-400 font-bold text-[11px]">#{i + 1}</span>
                            </div>
                            <h5 className="font-bold text-white text-xs">{title}</h5>
                            {desc && desc !== title && (
                              <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
                            )}
                            {reason && (
                              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
                                <strong className="text-slate-300">Rule Reason: </strong>
                                {reason}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Multi-tier Parent & Child Suppliers */}
                {(supplier?.parentSupplier || (supplier?.subSuppliers && supplier.subSuppliers.length > 0)) && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Supply Chain Hierarchy
                    </h4>
                    {supplier.parentSupplier && (
                      <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs flex justify-between">
                        <span className="text-slate-400">Parent Contractor (Tier {supplier.parentSupplier.tier}):</span>
                        <span className="text-white font-bold">{supplier.parentSupplier.name} ({supplier.parentSupplier.registrationNo})</span>
                      </div>
                    )}
                    {supplier.subSuppliers?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-slate-500 uppercase">Subcontractors (Tier {supplier.subSuppliers[0].tier}):</span>
                        {supplier.subSuppliers.map((sub: any) => (
                          <div key={sub.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs flex justify-between">
                            <span className="text-slate-300">{sub.name}</span>
                            <span className="font-mono text-emerald-400">{sub.trustScore} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CERTIFICATES */}
            {activeTab === "certs" && (
              <div className="space-y-3">
                {certs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No certificates registered.</div>
                ) : (
                  certs.map((c: any) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white">{c.number}</span>
                          {getFreshnessBadge(c.freshness)}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : c.status === "EXPIRING_SOON"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                        <span>Standard: {c.type}</span>
                        <span>Issuer: {c.issuer}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-mono text-[10px] pt-1 border-t border-slate-800">
                        <span>Issued: {new Date(c.issueDate).toLocaleDateString()}</span>
                        <span>Expires: {new Date(c.expiryDate).toLocaleDateString()} ({c.daysRemaining}d remaining)</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: EMISSIONS & SHIPMENTS */}
            {activeTab === "emissions" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Emissions Mode Breakdown</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(emissions?.modeBreakdown || {}).map(([mode, val]: [string, any]) => (
                      <div key={mode} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                        <span className="text-slate-400">{mode}:</span>
                        <span className="text-emerald-400 font-bold">{val.toLocaleString()} kg</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Recent Manifests ({shipments.length})</span>
                  {shipments.map((s: any) => (
                    <div key={s.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex justify-between items-center font-mono">
                      <div>
                        <span className="font-bold text-white block">{s.manifestId}</span>
                        <span className="text-[10px] text-slate-400">{s.origin} → {s.destination} ({s.distanceKm} km, {s.weightTonnes} t)</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{s.emissionsKg.toLocaleString()} kg CO₂e</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "documents" && (
              <div className="space-y-2.5">
                {docs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No documents ingested.</div>
                ) : (
                  docs.map((d: any) => (
                    <div key={d.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{d.filename}</span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono text-[9px] font-bold">
                            v{d.version}
                          </span>
                          {getFreshnessBadge(d.freshness)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          SHA-256: {d.sha256Hash?.slice(0, 16)}...
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-950 border border-slate-800 text-emerald-400">
                        {d.verificationStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: FORENSIC ALERTS */}
            {activeTab === "alerts" && (
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-emerald-400">Zero active forensic alerts. Clean compliance standing.</div>
                ) : (
                  alerts.map((a: any) => (
                    <div key={a.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase font-mono">{a.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            a.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{a.whatHappened}</p>
                      <p className="text-slate-500 text-[11px]">{a.whyItMatters}</p>
                      {a.recommendedAction && (
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-cyan-300">
                          <strong className="text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                            Action Engine Directives:
                          </strong>
                          {a.recommendedAction}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: AUDIT TRAIL */}
            {activeTab === "audit" && (
              <div className="space-y-2.5">
                {auditTrail.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No audit events recorded for this entity.</div>
                ) : (
                  auditTrail.map((log: any) => (
                    <div key={log.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300">{log.reason}</p>
                      <span className="text-[10px] text-slate-500 block truncate">Digest: {log.entryHash}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
