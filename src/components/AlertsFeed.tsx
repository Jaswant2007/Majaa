"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, ShieldAlert } from "lucide-react";

interface ComplianceAlertItem {
  id: string;
  supplierId: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  alertType: string;
  title: string;
  evidence: string;
  createdAt: string;
  supplier?: {
    name: string;
    code: string;
    tier: number;
  };
}

interface AlertsFeedProps {
  alerts: ComplianceAlertItem[];
}

export default function AlertsFeed({ alerts }: AlertsFeedProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          icon: <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />,
          pill: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          border: "border-rose-900/50 bg-rose-950/20",
        };
      case "WARNING":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
          pill: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          border: "border-amber-900/50 bg-amber-950/20",
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-cyan-400 shrink-0" />,
          pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          border: "border-cyan-900/50 bg-cyan-950/20",
        };
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Explainable Compliance Anomaly Feed</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {alerts.length} Open Flags
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Rule 9 & 10: Strict evidence-grounded anomaly citations. No unverified black-box verdicts.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          *Fraud detection flags anomalies for auditor verification; human review required.
        </div>
      </div>

      <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="font-semibold text-slate-300">All Active Credentials Fully Verified</p>
            <p className="text-slate-500 mt-0.5">Zero unresolved compliance anomalies or blacklists detected.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = getSeverityBadge(alert.severity);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition ${config.border} hover:border-slate-600`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5">{config.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${config.pill}`}>
                          {alert.severity} • {alert.alertType}
                        </span>
                        {alert.supplier && (
                          <span className="text-[11px] font-bold text-slate-300">
                            {alert.supplier.name} ({alert.supplier.code})
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1.5">{alert.title}</h4>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Evidence Box */}
                <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Auditable Forensic Evidence:
                  </span>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{alert.evidence}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
