"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
  Zap,
  Check,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "./AuthContext";

interface SubmissionPortalProps {
  onSubmissionComplete?: (result: any) => void;
  suppliers?: Array<{ id: string; name: string; registrationNo?: string; code?: string; tier: number }>;
}

const DEMO_PRESETS = [
  {
    id: "clean_apex",
    title: "Apex Global — Clean Electric Freight",
    desc: "Apex Global BEV Electric HGV with accredited TÜV ISO-14064 cert.",
    filename: "manifest-apex-bev.txt",
    badge: "VERIFIED GREEN",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    supplierCode: "NL-KVK-88491021",
    rawContent: `================================================================================
                   OFFICIAL GREEN FREIGHT CONSIGNMENT MANIFEST
                         APEX GLOBAL LOGISTICS BV
================================================================================
Manifest ID:       MNF-APX-2024-EV02
Shipper / Vendor:  Apex Global Logistics BV
Registration No:   NL-KVK-88491021
Origin Location:   Rotterdam Port Automated Terminal, Netherlands
Destination:       Brussels Green Cargo Center, Belgium
Transport Mode:    ROAD
Fuel Type:         ELECTRIC
Vehicle Unit:      NL-EV-FREIGHT-08 (40-Tonne Battery Electric HGV)
Gross Cargo Weight: 42000 kg (42.0 Metric Tonnes)
Transit Distance:  165 km
Consignment Type:  Recycled Pulp & Bio-Polymer Packaging Materials
Shipment Date:     2024-10-08

--------------------------------------------------------------------------------
                     ESG & ENVIRONMENTAL AUDIT SECTION
--------------------------------------------------------------------------------
Compliance Ref:    CERT-ISO-14064-APEX-2024
Certificate Type:  ISO_14064 (GHG Verification)
Issuing Authority: TÜV Rheinland Nederland
Issue Date:        2024-01-15
Expiry Date:       2027-01-14
Certification Status: ACTIVE / ACCREDITED
Declaration:       Primary activity data verified under EN 16258 / GLEC Framework.
================================================================================`,
  },
  {
    id: "expired_cert",
    title: "Trans-Eurasia — Expired Certificate Haulage",
    desc: "Heavy diesel road haulage referencing certificate expired on 2024-02-01.",
    filename: "manifest-transeurasia-freight.txt",
    badge: "AUDIT REQUIRED",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    supplierCode: "PL-KRS-0000918273",
    rawContent: `================================================================================
                    INTERNATIONAL CROSS-BORDER FREIGHT MANIFEST
                         TRANS-EURASIA FREIGHT CORP
================================================================================
Manifest ID:       MNF-TE-2024-EXP01
Shipper / Vendor:  Trans-Eurasia Freight Corp
Registration No:   PL-KRS-0000918273
Origin Location:   Warsaw Intermodal Logistics Terminal, Poland
Destination:       Rotterdam Europoort Cargo Hub, Netherlands
Transport Mode:    ROAD
Fuel Type:         DIESEL
Vehicle Unit:      PL-HGV-9941 (Heavy Diesel Articulated Tractor)
Gross Cargo Weight: 38200 kg (38.2 Metric Tonnes)
Transit Distance:  1150 km
Consignment Type:  Heavy Industrial Castings & Structural Assemblies
Shipment Date:     2024-10-08

--------------------------------------------------------------------------------
                     ESG & ENVIRONMENTAL AUDIT SECTION
--------------------------------------------------------------------------------
Compliance Ref:    CERT-ECO-TE-8812
Certificate Type:  ISO_14064 (GHG Verification)
Issuing Authority: DEKRA Certification Poland
Issue Date:        2022-02-01
Expiry Date:       2024-02-01  *** EXPIRED ***
Certification Status: EXPIRED - AUDIT LAPSED
Declaration:       Trans-Eurasia self-declaration (Uncertified freight).
================================================================================`,
  },
  {
    id: "supplier_mismatch",
    title: "Katanga Syndicate — Sanctioned Entity Dispatch",
    desc: "Shipper declares sanctioned Katanga entity under another account.",
    filename: "manifest-katanga-dispatch.txt",
    badge: "SANCTIONS HIT",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    supplierCode: "PL-KRS-0000918273",
    rawContent: `================================================================================
                    SUB-TIER MINERAL CONSIGNMENT DISPATCH NOTE
                       UNVERIFIED EXTRACTION SYNDICATE
================================================================================
Manifest ID:       MNF-MISMATCH-9901
Shipper / Vendor:  Katanga Raw Mineral Syndicate (Sanctioned Origin)
Registration No:   CD-RCCM-18-B-0982
Origin Location:   Kolwezi Mining Depot, Katanga Province, DR Congo
Destination:       Dar es Salaam Port Cargo Terminal, Tanzania
Transport Mode:    ROAD
Fuel Type:         DIESEL
Vehicle Unit:      TZ-HAUL-8812 (Unregistered Long-Haul Truck)
Gross Cargo Weight: 85000 kg (85.0 Metric Tonnes)
Transit Distance:  2400 km
Consignment Type:  Raw Artisanal Cobalt Ore & Copper Concentrate
Shipment Date:     2024-10-08

--------------------------------------------------------------------------------
                     ESG & ENVIRONMENTAL AUDIT SECTION
--------------------------------------------------------------------------------
Compliance Ref:    CERT-FORGED-KT-900
Certificate Type:  ISO_14064 (GHG Verification)
Issuing Authority: Unaccredited Shell Authority
Issue Date:        2021-01-01
Expiry Date:       2023-01-01  *** INVALID / FORGED ***
Certification Status: FORGED - NON-ACCREDITED
Declaration:       Uploaded under unlinked supplier account.
================================================================================`,
  },
];

const PIPELINE_STAGES = [
  "UPLOAD",
  "FILE_VALIDATION",
  "SHA256_HASH",
  "DUPLICATE_CHECK",
  "STORE",
  "TEXT_OCR_EXTRACTION",
  "LLM_ENTITY_EXTRACTION",
  "CROSS_FIELD_VALIDATION",
  "SUPPLIER_IDENTITY_MATCHING",
  "BLACKLIST_CHECK",
  "CERTIFICATE_VALIDATION",
  "ANOMALY_DETECTION",
  "SCOPE3_CALCULATION",
  "RISK_SCORE_RECALC",
];

export default function SubmissionPortal({ onSubmissionComplete, suppliers: initialSuppliers }: SubmissionPortalProps = {}) {
  const { user, role, roleLabel } = useAuth();
  const [internalSuppliers, setInternalSuppliers] = useState<any[]>([]);
  const suppliers = initialSuppliers || internalSuppliers;

  React.useEffect(() => {
    if (!initialSuppliers || initialSuppliers.length === 0) {
      fetch("/api/suppliers")
        .then((res) => res.json())
        .then((data) => {
          if (data?.suppliers) setInternalSuppliers(data.suppliers);
        })
        .catch(() => {});
    }
  }, [initialSuppliers]);

  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0]);
  const [customText, setCustomText] = useState(DEMO_PRESETS[0].rawContent);
  const [filename, setFilename] = useState(DEMO_PRESETS[0].filename);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);

  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setSelectedPreset(preset);
    setCustomText(preset.rawContent);
    setFilename(preset.filename);
    const supp = suppliers.find(
      (s) => s.registrationNo === preset.supplierCode || s.code === preset.supplierCode
    );
    if (supp) setSelectedSupplierId(supp.id);
  };

  const handleRunPipeline = async () => {
    setIsSubmitting(true);
    setPipelineResult(null);
    setCurrentStepIndex(1);

    try {
      let suppId = selectedSupplierId;
      if (!suppId) {
        const supp = suppliers.find(
          (s) => s.registrationNo === selectedPreset.supplierCode || s.code === selectedPreset.supplierCode
        );
        suppId = supp?.id || suppliers[0]?.id || "";
      }

      // Simulate visually stepped progression
      for (let i = 2; i <= 14; i++) {
        await new Promise((r) => setTimeout(r, 120));
        setCurrentStepIndex(i);
      }

      const res = await fetch("/api/pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: customText,
          filename: filename,
          supplierId: suppId,
        }),
      });

      const data = await res.json();
      setPipelineResult(data);
      onSubmissionComplete?.(data);
    } catch (err) {
      console.error("Pipeline run failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "COMPLIANT":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "UNDER REVIEW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "ACTION REQUIRED":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Zero-Trust Ingestion Pipeline</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                14 ATOMIC STEPS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Active Session: <strong className="text-emerald-300">{roleLabel}</strong>. Cryptographic verification, cross-field validation, and real-time badge updates.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isSubmitting}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition flex items-center justify-center space-x-2 shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
            isSubmitting
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 ring-1 ring-emerald-400/50"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Step {currentStepIndex}/14 Executing...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Execute Ingestion Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Demo Document Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Select Consignment Manifest:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_PRESETS.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition card-hover ${
                selectedPreset.id === p.id
                  ? "bg-slate-900 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{p.filename}</span>
              </div>
              <h4 className="text-xs font-bold text-white">{p.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 14-Step Visual Stepper Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Verification Stepper (14 Stages)</span>
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Progress: {currentStepIndex} / 14 Completed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
          {PIPELINE_STAGES.map((stage, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStepIndex >= stepNum;
            const isCurrent = currentStepIndex === stepNum;

            return (
              <div
                key={stage}
                className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center ${
                  isCurrent
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400"
                    : isCompleted
                    ? "bg-slate-900 border-emerald-800/80 text-emerald-400"
                    : "bg-slate-950/60 border-slate-800/60 text-slate-600"
                }`}
              >
                <div className="flex items-center space-x-1 mb-0.5">
                  <span className="text-[10px] font-mono font-bold">#{stepNum}</span>
                  {isCompleted && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-tight truncate w-full">
                  {stage.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Payload Editor & Output Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              <span>Manifest Raw Payload ({filename})</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">Editable Test Buffer</span>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={12}
            className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Real-Time Result Cards */}
        <div className="space-y-4">
          {pipelineResult ? (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 animate-fadeIn text-xs">
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Real-Time Compliance Badge:
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-black border ${getBadgeColor(
                      pipelineResult.risk?.complianceBadge
                    )}`}
                  >
                    {pipelineResult.risk?.complianceBadge}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Trust Score Delta:
                  </span>
                  <span className="text-sm font-black text-white">
                    {pipelineResult.risk?.previousScore} → {pipelineResult.risk?.newScore} (
                    <span
                      className={
                        pipelineResult.risk?.scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                      }
                    >
                      {pipelineResult.risk?.scoreDelta >= 0 ? "+" : ""}
                      {pipelineResult.risk?.scoreDelta} pts
                    </span>
                    )
                  </span>
                </div>
              </div>

              {/* Scope-3 Deterministic Math Breakdown */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Deterministic Scope-3 Carbon Footprint:
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-white font-mono">
                    {pipelineResult.calculation?.result?.toLocaleString()}
                  </span>
                  <span className="font-bold text-slate-400">kg CO₂e</span>
                </div>
                <p className="text-[11px] font-mono text-cyan-300 mt-1">
                  Formula: {pipelineResult.calculation?.formula}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Emission Factor: {pipelineResult.calculation?.factor} ({pipelineResult.calculation?.factorSource})
                </p>
              </div>

              {/* Human-Readable Risk Explanation List */}
              {pipelineResult.risk?.explanations && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Risk Engine Forensic Explanation:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    {pipelineResult.risk.explanations.map((exp: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Fields Confidence Inspector Sample */}
              {pipelineResult.extraction && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Structured Fields & Confidence Thresholds:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Distance:</span>
                      <span className="text-white font-bold">
                        {pipelineResult.extraction.freightDistance?.value} km (
                        {Math.round(pipelineResult.extraction.freightDistance?.confidence * 100)}%)
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Cargo Weight:</span>
                      <span className="text-white font-bold">
                        {pipelineResult.extraction.cargoWeight?.value} kg (
                        {Math.round(pipelineResult.extraction.cargoWeight?.confidence * 100)}%)
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Mode / Fuel:</span>
                      <span className="text-cyan-400 font-bold">
                        {pipelineResult.extraction.transportMode?.value} • {pipelineResult.extraction.fuelType?.value}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Certificate:</span>
                      <span className="text-emerald-400 font-bold truncate max-w-[120px]">
                        {pipelineResult.extraction.certificateNumber?.value}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[280px] p-8 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center text-center text-xs text-slate-500">
              <Zap className="h-8 w-8 text-emerald-500/40 mb-3" />
              <p className="font-semibold text-slate-400">Pipeline Ready for Execution</p>
              <p className="text-slate-500 max-w-xs mt-1">
                Click &quot;Run Judging Demo Pipeline&quot; to stream all 14 steps, extract entities, compute Scope-3 emissions, and update trust score live.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
