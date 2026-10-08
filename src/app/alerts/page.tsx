"use client";

import React, { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  Building2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RiskAlertCenterPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    },
  });

  const alerts = data?.alerts || [];

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a: any) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (severityFilter !== "ALL" && a.severity !== severityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSupplier = a.supplier?.name?.toLowerCase().includes(q);
        const matchesType = a.type?.toLowerCase().includes(q);
        const matchesWhat = a.whatHappened?.toLowerCase().includes(q);
        if (!matchesSupplier && !matchesType && !matchesWhat) return false;
      }
      return true;
    });
  }, [alerts, statusFilter, severityFilter, searchQuery]);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold uppercase tracking-wider interactive-badge font-mono">
              Risk Monitor
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Forensic Auditing</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Alerts & Risk</h1>
          <p className="text-xs text-slate-400">
            Forensic anomalies, evidence traces, and corrective remediation workflows.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 card-hover">
            Open Alerts: <strong className="text-rose-400">{alerts.filter((a: any) => a.status === "OPEN").length}</strong>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by supplier, anomaly type, or description..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 font-mono"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="sm:col-span-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading forensic alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="glass-panel p-16 text-center text-xs text-slate-500">
            No alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map((alert: any) => {
            const isCritical = alert.severity === "CRITICAL";
            const isWarning = alert.severity === "WARNING";
            const isResolved = alert.status === "RESOLVED";

            return (
              <div
                key={alert.id}
                className={`glass-panel p-5 rounded-2xl border transition-all card-hover ${
                  isResolved
                    ? "border-slate-800/80 bg-slate-950/40 opacity-75"
                    : isCritical
                    ? "border-rose-900/60 bg-rose-950/15"
                    : isWarning
                    ? "border-amber-900/60 bg-amber-950/15"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {isCritical ? (
                        <AlertOctagon className="h-5 w-5 text-rose-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Info className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                            isCritical
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : isWarning
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          }`}
                        >
                          {alert.severity} • {alert.type}
                        </span>

                        <button
                          onClick={() => setSelectedSupplierId(alert.supplier?.id)}
                          className="text-xs font-bold text-white hover:text-emerald-400 transition flex items-center space-x-1"
                        >
                          <span>{alert.supplier?.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">(Tier {alert.supplier?.tier})</span>
                          <ExternalLink className="h-3 w-3 text-slate-500 ml-0.5" />
                        </button>
                      </div>

                      <h3 className="text-sm font-bold text-white mt-1.5">{alert.whatHappened}</h3>
                    </div>
                  </div>

                  {/* Status Workflow Controls */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono border ${
                        alert.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : alert.status === "INVESTIGATING"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {alert.status}
                    </span>

                    {alert.status === "OPEN" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: alert.id, status: "INVESTIGATING" })}
                        disabled={statusMutation.isPending}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
                      >
                        Investigate
                      </button>
                    )}

                    {alert.status !== "RESOLVED" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: alert.id, status: "RESOLVED" })}
                        disabled={statusMutation.isPending}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3-Part Forensic Explainability Grid */}
                <div className="mt-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                      1. Why It Matters:
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans">{alert.whyItMatters}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1 font-sans">
                      2. Auditable Evidence:
                    </span>
                    <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-28">
                      {typeof alert.evidence === "string" ? alert.evidence : JSON.stringify(alert.evidence, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      3. Recommended Action:
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans">{alert.recommendedAction}</p>
                  </div>
                </div>
              </div>
            );
          })
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
