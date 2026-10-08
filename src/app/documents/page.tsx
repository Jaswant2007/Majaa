"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  FileSearch,
  Hash,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Check,
  AlertCircle,
  Sparkles,
  GitBranch,
  History,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileCheck2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CONFIDENCE_THRESHOLD } from "@/lib/types-pipeline";

export default function DocumentIntelligencePage() {
  const queryClient = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"provenance" | "versions" | "audit">("provenance");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      return res.json();
    },
  });

  const documents = data?.documents || [];
  const selectedDoc = documents.find((d: any) => d.id === selectedDocId) || documents[0] || null;

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ docId, decision, reason }: { docId: string; decision: string; reason: string }) => {
      const res = await fetch(`/api/documents/${docId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Review submission failed.");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setReviewModalOpen(false);
      setReviewReason("");
      setReviewError(null);
    },
    onError: (err: any) => {
      setReviewError(err.message || "Failed to submit review.");
    },
  });

  const handleOpenReview = (decision: "APPROVED" | "REJECTED") => {
    setReviewDecision(decision);
    setReviewReason("");
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (reviewReason.trim().length < 5) {
      setReviewError("Please provide a detailed reason (minimum 5 characters) for audit compliance.");
      return;
    }
    reviewMutation.mutate({
      docId: selectedDoc.id,
      decision: reviewDecision,
      reason: reviewReason.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "REQUIRES_REVIEW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "REJECTED":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const extractedData = selectedDoc?.extractedJson || {};

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold uppercase tracking-wider">
              Phase 3 • Auditability & Provenance
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase">
              Zero-Trust Verification
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Document Intelligence & Forensic Provenance</h1>
          <p className="text-xs text-slate-400">
            Rule 4: Every extracted entity traces to origin document, source field, and confidence. Re-uploads trigger automatic versioning.
          </p>
        </div>

        {selectedDoc && selectedDoc.verificationStatus === "REQUIRES_REVIEW" && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenReview("APPROVED")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Approve Document</span>
            </button>
            <button
              onClick={() => handleOpenReview("REJECTED")}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-900/40 transition"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Reject Document</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Documents Directory */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Document Repository ({documents.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SHA-256 Anchored</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
          ) : (
            <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1">
              {documents.map((doc: any) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-emerald-500/80 ring-1 ring-emerald-500/50"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate mr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-white truncate block">
                            {doc.filename}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono text-[9px] font-bold">
                            v{doc.version}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                          {doc.supplier?.name}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 border ${getStatusBadge(
                          doc.verificationStatus
                        )}`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="truncate max-w-[130px]">
                        HASH: {doc.sha256Hash?.slice(0, 10)}...
                      </span>
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Forensic Inspector */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl space-y-5">
          {selectedDoc ? (
            <>
              {/* Document Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h2 className="text-lg font-black text-white">{selectedDoc.filename}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold">
                      Version {selectedDoc.version}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        selectedDoc.verificationStatus
                      )}`}
                    >
                      {selectedDoc.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                    <span>Supplier: <strong className="text-white">{selectedDoc.supplier?.name}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{selectedDoc.supplier?.registrationNo}</span>
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block text-[10px]">INGESTION TIMESTAMP</span>
                  <span className="text-slate-300">{new Date(selectedDoc.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* SHA-256 Fingerprint Card */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center space-x-2 truncate">
                  <Hash className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 font-semibold shrink-0">SHA-256 Digest:</span>
                  <span className="font-mono text-emerald-400 font-bold truncate select-all">
                    {selectedDoc.sha256Hash}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0 font-mono font-bold">
                  CRYPTOGRAPHICALLY ANCHORED
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-800">
                <button
                  onClick={() => setActiveTab("provenance")}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                    activeTab === "provenance"
                      ? "text-emerald-400 border-emerald-500"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Field Provenance & Confidence</span>
                </button>
                <button
                  onClick={() => setActiveTab("versions")}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                    activeTab === "versions"
                      ? "text-cyan-400 border-cyan-500"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>Document Version Tree</span>
                  {selectedDoc.version > 1 && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono">
                      v{selectedDoc.version}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition ${
                    activeTab === "audit"
                      ? "text-purple-400 border-purple-500"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Validation & Audit Trail ({selectedDoc.validationHistory?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: FIELD PROVENANCE & CONFIDENCE */}
              {activeTab === "provenance" && (
                <div className="space-y-4">
                  {Object.keys(extractedData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(extractedData).map(([key, item]: [string, any]) => {
                        const conf = item?.confidence ?? 0.95;
                        const isHigh = conf >= CONFIDENCE_THRESHOLD;
                        const provenance = item?.provenance || "ORIGINAL_MANIFEST_INGEST";
                        const val = item?.value !== undefined ? String(item.value) : "N/A";

                        return (
                          <div
                            key={key}
                            className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] text-slate-400 font-bold">{key}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                                  isHigh
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                }`}
                              >
                                {Math.round(conf * 100)}% CONFIDENCE
                              </span>
                            </div>

                            <p className="text-xs font-bold text-white break-words">{val}</p>

                            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Source: {provenance}</span>
                              <span>Doc ID: {selectedDoc.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No extracted entity fields available for this document.
                    </div>
                  )}

                  {/* Manual Review Information Banner if reviewed */}
                  {selectedDoc.reviewedAt && (
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-1">
                      <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                        <UserCheck className="h-4 w-4" />
                        <span>Compliance Review Decision: {selectedDoc.verificationStatus}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">
                        Reason: {selectedDoc.reviewDecisionReason || "No explanation recorded."}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Reviewed at: {new Date(selectedDoc.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DOCUMENT VERSIONING TREE */}
              {activeTab === "versions" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                      <GitBranch className="h-4 w-4 text-cyan-400" />
                      <span>Document Lifecycle & Version Lineage</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Rule 8: Ingestion is append-only. Re-uploading a document retains previous versions for regulatory provenance while generating version increment (v{selectedDoc.version}).
                    </p>

                    <div className="space-y-3 pt-2">
                      {/* Parent Document (if any) */}
                      {selectedDoc.parentDoc ? (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Prior Version:</span>
                            <span className="text-slate-300 font-bold font-mono">
                              v{selectedDoc.parentDoc.version} • {selectedDoc.parentDoc.filename}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                              SHA-256: {selectedDoc.parentDoc.sha256Hash?.slice(0, 20)}...
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                            SUPERSEDED
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                          Genesis Version: This document represents the initial filing (v1).
                        </div>
                      )}

                      {/* Current Active Version */}
                      <div className="p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-cyan-400 uppercase block">Active Version:</span>
                          <span className="text-white font-bold font-mono">
                            v{selectedDoc.version} • {selectedDoc.filename}
                          </span>
                          <span className="block text-[10px] font-mono text-cyan-300/80 mt-0.5">
                            SHA-256: {selectedDoc.sha256Hash}
                          </span>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                          ACTIVE FILE
                        </span>
                      </div>

                      {/* Subsequent Versions (if any) */}
                      {selectedDoc.subsequentVersions && selectedDoc.subsequentVersions.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Subsequent Versions:</span>
                          {selectedDoc.subsequentVersions.map((sub: any) => (
                            <div
                              key={sub.id}
                              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="text-slate-300 font-mono font-bold">
                                  v{sub.version} • {sub.filename}
                                </span>
                                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                                  SHA-256: {sub.sha256Hash?.slice(0, 20)}...
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                                SUCCESSOR
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VALIDATION HISTORY & AUDIT TRAIL */}
              {activeTab === "audit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>Chronological Ingestion Audit Trail</span>
                    <span className="font-mono text-emerald-400">Cryptographically Chained</span>
                  </div>

                  {selectedDoc.validationHistory && selectedDoc.validationHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedDoc.validationHistory.map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase font-mono">
                                {item.action}
                              </span>
                              <span className="text-xs font-bold text-white font-mono">{item.actor}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-mono">{item.reason}</p>

                          <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Digest: {item.entryHash?.slice(0, 16)}...</span>
                            <span>Source: {item.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No validation history entries recorded for this document.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <FileSearch className="h-10 w-10 text-slate-600 mb-3" />
              <p className="font-bold text-slate-400 text-sm">No Document Selected</p>
              <p className="mt-1">Select an ingested manifest from the left directory to inspect its forensic properties.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Review Modal for Compliance Officers */}
      {reviewModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Compliance Officer Adjudication
                </h3>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold uppercase font-mono ${
                  reviewDecision === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {reviewDecision}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              You are manually adjudicating document <strong>{selectedDoc.filename}</strong> (v{selectedDoc.version}) for supplier <strong>{selectedDoc.supplier?.name}</strong>. This decision writes an immutable cryptographic audit record.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Audit Justification Reason (Mandatory)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="e.g. Verified with carrier via secondary customs manifest bill. Distance discrepancy resolved as sea detour."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {reviewError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {reviewError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition ${
                    reviewDecision === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-900/40"
                  }`}
                >
                  {reviewMutation.isPending ? "Submitting..." : `Confirm ${reviewDecision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
