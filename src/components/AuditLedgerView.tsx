"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  ShieldCheck,
  Hash,
  Link2,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  FileText,
  Truck,
  Building,
  Award,
  Calculator,
  Bell,
  Cpu,
} from "lucide-react";

export interface AuditLogRecord {
  id: string;
  actor: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string | null;
  newValue?: string | null;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  evidence?: string | null;
  source: string;
  entryHash: string;
  prevHash?: string;
  timestamp: string;
  supplier?: {
    name: string;
    code: string;
    tier: number;
  };
}

interface AuditLedgerViewProps {
  logs: AuditLogRecord[];
  integrityStatus: string;
  onRefresh?: () => void;
}

export default function AuditLedgerView({
  logs,
  integrityStatus,
  onRefresh,
}: AuditLedgerViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntity !== "ALL" && log.entityType !== selectedEntity) return false;
      if (selectedAction !== "ALL" && log.action !== selectedAction) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesActor = log.actor?.toLowerCase().includes(query);
        const matchesReason = log.reason?.toLowerCase().includes(query) || log.evidence?.toLowerCase().includes(query);
        const matchesEntityId = log.entityId?.toLowerCase().includes(query);
        const matchesHash = log.entryHash?.toLowerCase().includes(query);
        const matchesAction = log.action?.toLowerCase().includes(query);
        if (!matchesActor && !matchesReason && !matchesEntityId && !matchesHash && !matchesAction) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedEntity, selectedAction, searchTerm]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/audit/verify");
      const json = await res.json();
      setVerificationResult(json);
    } catch (e: any) {
      setVerificationResult({ isValid: false, error: e.message || "Failed to verify chain" });
    } finally {
      setVerifying(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sourcetrace-audit-ledger-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "UPLOAD":
      case "DOCUMENT_VERSIONED":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "EXTRACTION":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "IDENTITY_CHECK":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "CERT_CHECK":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      case "CALCULATION":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "RISK_CHANGE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "STATUS_CHANGE":
        return "bg-violet-500/20 text-violet-300 border-violet-500/30";
      case "ALERT_CREATED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "MANUAL_REVIEW":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "VERIFIED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "FLAGGED":
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "DOCUMENT":
        return <FileText className="h-3.5 w-3.5 text-cyan-400" />;
      case "SHIPMENT":
        return <Truck className="h-3.5 w-3.5 text-blue-400" />;
      case "SUPPLIER":
        return <Building className="h-3.5 w-3.5 text-amber-400" />;
      case "CERTIFICATE":
        return <Award className="h-3.5 w-3.5 text-teal-400" />;
      case "CALCULATION":
        return <Calculator className="h-3.5 w-3.5 text-emerald-400" />;
      case "ALERT":
        return <Bell className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Layers className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const renderValueDiff = (prev: string | null | undefined, next: string | null | undefined) => {
    if (!prev && !next) return null;

    // Check if it's a simple number or string e.g. "82 -> 61"
    const isSimple = (s: string | null | undefined) => {
      if (!s) return true;
      return !s.startsWith("{") && !s.startsWith("[") && s.length < 30;
    };

    if (isSimple(prev) && isSimple(next)) {
      return (
        <div className="flex items-center space-x-2 font-mono text-xs my-1 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800/80">
          <span className="text-slate-400">{prev || "null"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-emerald-400">{next || "null"}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Verification Inspector */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Cryptographic ESG Audit Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                  TAMPER-EVIDENT HASH CHAIN
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Rule 8: Append-only cryptographic event trace. Every state mutation chains the prior block hash (stated as tamper-evident, not tamper-proof).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-800/60 hover:bg-slate-800 text-xs font-bold text-emerald-400 flex items-center space-x-1.5 transition"
            >
              <ShieldCheck className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
              <span>{verifying ? "Verifying Chain..." : "Verify Chain Integrity"}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Ledger</span>
            </button>
          </div>
        </div>

        {/* Live Verification Report Banner */}
        {verificationResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-start justify-between text-xs animate-fadeIn ${
              verificationResult.isValid
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/80 text-rose-300"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-bold">
                {verificationResult.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                )}
                <span>
                  {verificationResult.isValid
                    ? `Chain Cryptographically Verified (${verificationResult.verifiedBlocks}/${verificationResult.totalEntries} blocks intact)`
                    : `Ledger Discrepancy Detected: ${verificationResult.error}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Head Block: {verificationResult.headHash || "N/A"}
              </p>
              <p className="text-[10px] text-slate-400">
                Notice: All blocks are linked via SHA-256 forward hashes, ensuring full tamper-evidence across the disclosure trail.
              </p>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-xs text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by actor, reason, entity ID, hash..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Entities</option>
              <option value="DOCUMENT">Document</option>
              <option value="SHIPMENT">Shipment</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="CALCULATION">Calculation</option>
              <option value="ALERT">Alert</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="UPLOAD">UPLOAD</option>
              <option value="EXTRACTION">EXTRACTION</option>
              <option value="IDENTITY_CHECK">IDENTITY_CHECK</option>
              <option value="CERT_CHECK">CERT_CHECK</option>
              <option value="CALCULATION">CALCULATION</option>
              <option value="RISK_CHANGE">RISK_CHANGE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="ALERT_CREATED">ALERT_CREATED</option>
              <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
              <option value="DOCUMENT_VERSIONED">DOCUMENT_VERSIONED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chronological Event Trace List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Displaying {filteredLogs.length} of {logs.length} ledger events
          </span>
          <span className="font-mono text-emerald-400 font-bold">Strictly Append-Only</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 text-xs">
            No audit ledger events match the specified filter criteria.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isExpanded = expandedId === log.id;
            const diffDisplay = renderValueDiff(
              log.previousValue ?? log.previousState,
              log.newValue ?? log.newState
            );

            return (
              <div
                key={log.id}
                className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div
                  className="flex items-start justify-between cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 font-bold shrink-0">
                      #{filteredLogs.length - index}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>

                        <span className="text-xs font-bold text-white flex items-center space-x-1">
                          {getEntityIcon(log.entityType)}
                          <span>{log.entityType}</span>
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {log.entityId}
                        </span>

                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                          SRC: {log.source}
                        </span>
                      </div>

                      {/* Before -> After Diff preview if available */}
                      {diffDisplay}

                      {/* Reason / Explainability text */}
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {log.reason || log.evidence}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 justify-end">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium font-mono">
                        {log.actor}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Cryptographic Hash Inspector Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono gap-2 text-slate-400">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Hash className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-slate-500">Block Digest:</span>
                    <span className="text-emerald-400/90 truncate select-all">{log.entryHash}</span>
                  </div>
                  {log.prevHash && (
                    <div className="flex items-center space-x-1.5 truncate">
                      <Link2 className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span className="text-slate-500">Prev Block:</span>
                      <span className="text-slate-400 truncate select-all">{log.prevHash}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Detailed State Diff Inspector */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-amber-400 font-bold block mb-1">
                          Previous State (previousValue):
                        </span>
                        <pre className="text-slate-400 overflow-x-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800 max-h-40">
                          {log.previousValue ?? log.previousState ?? "null (GENESIS_INITIAL)"}
                        </pre>
                      </div>

                      <div>
                        <span className="text-emerald-400 font-bold block mb-1">
                          Mutated State (newValue):
                        </span>
                        <pre className="text-emerald-300 overflow-x-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800 max-h-40">
                          {log.newValue ?? log.newState ?? "null"}
                        </pre>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Source Engine: {log.source}</span>
                      <span>Event UUID: {log.id}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
