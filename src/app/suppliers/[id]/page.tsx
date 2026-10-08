"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import {
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
  ArrowLeft,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function StandaloneSupplier360Page() {
  const params = useParams();
  const supplierId = params?.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "certs" | "emissions" | "documents" | "alerts" | "audit">("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-360", supplierId],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      if (!res.ok) throw new Error("Failed to load supplier profile");
      return res.json();
    },
    enabled: !!supplierId,
  });

  const supplier = data?.supplier;
  const risk = data?.riskAnalysis;
  const emissions = data?.emissions;
  const certs = data?.certificates || [];
  const docs = data?.documents || [];
  const shipments = data?.shipments || [];
  const alerts = data?.alerts || [];
  const auditTrail = data?.auditTrail || [];
  const recommendedActions = data?.recommendedActions || [];

  return (
    <AppLayout>
      <div className="pb-3 border-b border-slate-800 space-y-2">
        <Link
          href="/suppliers"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Supplier Registry</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase font-mono">
                Tier {supplier?.tier || 1} Supplier Dossier
              </span>
              {supplier?.isStale && (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold uppercase font-mono">
                  STALE DATA
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white mt-1">{supplier?.name || "Loading..."}</h1>
            <p className="text-xs text-slate-400 font-mono">
              Reg: {supplier?.registrationNo} • Country: {supplier?.country}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              {supplier?.status || "ACTIVE"}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading supplier 360 profile...</div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trust Score</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                {supplier?.trustScore?.toFixed(1) || 0}
                <span className="text-xs text-slate-500 font-normal"> /100</span>
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scope-3 Footprint</span>
              <span className="text-3xl font-black text-white font-mono mt-1 block">
                {emissions?.totalEmissionsTonnes || 0}
                <span className="text-xs text-slate-500 font-normal"> t CO₂e</span>
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Certifications</span>
              <span className="text-3xl font-black text-cyan-400 font-mono mt-1 block">
                {certs.length}
                <span className="text-xs text-slate-500 font-normal"> Active</span>
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Data Freshness</span>
              <span className={`text-3xl font-black font-mono mt-1 block ${supplier?.isStale ? "text-amber-400" : "text-slate-300"}`}>
                {supplier?.daysSinceAudit ?? 0}d
                <span className="text-xs text-slate-500 font-normal"> ago</span>
              </span>
            </div>
          </div>

          {/* Explainable Risk Assessment */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Explainable Risk Assessment Model (Rule 5)</span>
            </h3>
            <p className="text-xs text-white leading-relaxed font-mono bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              {risk?.explanation}
            </p>

            {risk?.breakdown && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
                {Object.entries(risk.breakdown).map(([k, v]: [string, any]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-400 capitalize">{k}:</span>
                    <span className="text-white font-bold">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Recommended Governance Actions</span>
            </h3>
            <div className="space-y-2">
              {recommendedActions.map((action: string, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-2.5 text-xs">
                  <span className="font-mono text-cyan-400 font-bold">#{i + 1}</span>
                  <span className="text-slate-300 leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
