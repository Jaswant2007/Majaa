"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import SubmissionPortal from "@/components/SubmissionPortal";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  CloudRain,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Building2,
  FileText,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/components/AuthContext";

export default function ExecutiveDashboard() {
  const queryClient = useQueryClient();
  const { roleLabel } = useAuth();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [showLiveUpload, setShowLiveUpload] = useState<boolean>(true);

  // 1. Fetch live dashboard metrics from API
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      return res.json();
    },
  });

  // 2. Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to load suppliers");
      return res.json();
    },
  });

  // Setup Live SSE Realtime Connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/stream/events");
      eventSource.addEventListener("audit_committed", () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        queryClient.invalidateQueries({ queryKey: ["shipments"] });
      });
      eventSource.addEventListener("alert_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      });
    } catch {
      // Fallback
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [queryClient]);

  const kpis = statsData?.kpis || {
    totalSuppliers: 0,
    tier1Count: 0,
    tier2Count: 0,
    tier3Count: 0,
    verifiedSuppliersCount: 0,
    unverifiedSuppliersCount: 0,
    highRiskSuppliersCount: 0,
    actionRequiredCount: 0,
    totalScope3Kg: 0,
    totalScope3Tonnes: 0,
    verifiedScope3Tonnes: 0,
    unverifiedScope3Tonnes: 0,
    expiringCertsCount: 0,
    suspiciousDocsCount: 0,
  };

  const charts = statsData?.charts || {
    emissionsTrend: [],
    riskDistribution: [],
    compliancePie: [],
    tierStats: [],
  };

  const recentAlerts = statsData?.recentAlerts || [];
  const freshness = statsData?.freshness || {};
  const suppliers = suppliersData?.suppliers || [];

  const PIE_COLORS: Record<string, string> = {
    COMPLIANT: "var(--color-tertiary)",
    "ACTION REQUIRED": "var(--color-accent)",
    "UNDER REVIEW": "var(--color-tertiary)",
    "HIGH RISK": "var(--color-accent)",
    EXPIRED: "var(--color-accent)",
  };

  return (
    <AppLayout>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider interactive-badge">
              ESG Command Center
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-300 text-xs font-medium">{roleLabel}</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE LEDGER</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time Scope-3 emissions, vendor verification, and cryptographic audit ledger.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLiveUpload(!showLiveUpload)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-950/40 transition duration-200"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{showLiveUpload ? "Close Ingest Panel" : "Quick Ingest"}</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Judging Pipeline Demo (Phase 2 core workflow) */}
      {showLiveUpload && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-950/20 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">
                Consignment Verification Pipeline
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
              Zero-Trust Ingestion
            </span>
          </div>
          <SubmissionPortal />
        </div>
      )}

      {/* 8 KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Suppliers */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Suppliers</span>
            <Building2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{kpis.totalSuppliers}</div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            T1: <strong className="text-emerald-400">{kpis.tier1Count}</strong> • T2:{" "}
            <strong className="text-cyan-400">{kpis.tier2Count}</strong> • T3:{" "}
            <strong className="text-teal-400">{kpis.tier3Count}</strong>
          </p>
        </div>

        {/* KPI 2: Verified vs Unverified */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified Vendors</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {kpis.verifiedSuppliersCount}{" "}
            <span className="text-xs text-slate-400 font-normal">/ {kpis.totalSuppliers}</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Pending: <strong className="text-amber-400">{kpis.unverifiedSuppliersCount}</strong> vendors
          </p>
        </div>

        {/* KPI 3: High-Risk Suppliers */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">High Risk</span>
            <ShieldAlert className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{kpis.highRiskSuppliersCount}</div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Score &lt; 70 or Sanctioned
          </p>
        </div>

        {/* KPI 4: Action Required */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Action Needed</span>
            <AlertTriangle className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{kpis.actionRequiredCount}</div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Pending review
          </p>
        </div>

        {/* KPI 5: Total Scope-3 Footprint */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Scope-3</span>
            <CloudRain className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.totalScope3Tonnes} <span className="text-xs text-slate-400 font-normal">t CO₂e</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Verified: <strong className="text-emerald-400">{kpis.verifiedScope3Tonnes} t</strong>
          </p>
        </div>

        {/* KPI 6: At-Risk Emissions */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">At-Risk</span>
            <Flame className="h-4 w-4 text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono">
            {kpis.unverifiedScope3Tonnes} <span className="text-xs text-slate-400 font-normal">t CO₂e</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Unverified activity
          </p>
        </div>

        {/* KPI 7: Expiring Certificates */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Expiring Certs</span>
            <Award className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">{kpis.expiringCertsCount}</div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Next 30 days
          </p>
        </div>

        {/* KPI 8: Suspicious Documents */}
        <div className={`glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden card-hover group ${isLoading ? "animate-shimmer" : ""}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Suspicious Docs</span>
            <FileText className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{kpis.suspiciousDocsCount}</div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Flagged for review
          </p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Emissions Trend Area Chart */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-4 card-hover">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Scope-3 Trajectory</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified primary activity vs unverified emissions (tonnes CO₂e).
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Monthly</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.emissionsTrend}>
                <defs>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tertiary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-color)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="verified"
                  name="Verified Scope-3"
                  stroke="var(--color-tertiary)"
                  fillOpacity={1}
                  fill="url(#colorVerified)"
                />
                <Area
                  type="monotone"
                  dataKey="atRisk"
                  name="At-Risk Emissions"
                  stroke="var(--color-accent)"
                  fillOpacity={1}
                  fill="url(#colorAtRisk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Compliance Status Pie Chart */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl space-y-4 card-hover">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Compliance Ratio</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Distribution</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.compliancePie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {charts.compliancePie.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || "var(--text-muted)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-color)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: RISK DISTRIBUTION & RECENT ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Risk Distribution Bar Chart */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4 card-hover">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="h-4 w-4 text-teal-400" />
              <span>Risk Distribution</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Risk Bands</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="range" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-color)", borderRadius: 8, fontSize: 11, color: "var(--text-primary)" }}
                />
                <Bar dataKey="count" name="Suppliers" fill="var(--color-tertiary)" radius={[4, 4, 0, 0]}>
                  {charts.riskDistribution.map((entry: any, idx: number) => (
                    <Cell key={`bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-3 card-hover">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Recent Alerts</span>
            </h3>
            <a
              href="/alerts"
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center space-x-1 hover:translate-x-0.5 transition-transform"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active alerts.</div>
            ) : (
              recentAlerts.map((a: any) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between text-xs gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono uppercase ${
                          a.severity === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {a.severity}
                      </span>
                      <button
                        onClick={() => setSelectedSupplierId(a.supplier?.id)}
                        className="font-bold text-white hover:text-emerald-400 transition"
                      >
                        {a.supplier?.name}
                      </button>
                    </div>
                    <p className="text-slate-300 mt-1 line-clamp-1">{a.whatHappened}</p>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DATA FRESHNESS & LEDGER ANCHOR FOOTER */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono gap-2 text-slate-400">
        <div className="flex items-center space-x-2 truncate">
          <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>Latest Ingest:</span>
          <span className="text-slate-200">
            {freshness.latestIngestionAt
              ? new Date(freshness.latestIngestionAt).toLocaleString()
              : "Active"}
          </span>
        </div>
        <div className="flex items-center space-x-2 truncate">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Ledger Head Block:</span>
          <span className="text-emerald-400/90 truncate select-all">
            {freshness.latestAuditHeadHash ? `${freshness.latestAuditHeadHash.slice(0, 24)}...` : "ANCHORED"}
          </span>
        </div>
      </div>

      {/* Supplier 360 Drawer */}
      <Supplier360Drawer
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </AppLayout>
  );
}
