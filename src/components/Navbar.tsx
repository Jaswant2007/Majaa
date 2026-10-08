"use client";

import React from "react";
import { ShieldCheck, Activity, Cpu, Sparkles, Layers } from "lucide-react";

interface NavbarProps {
  sseConnected: boolean;
  ledgerIntegrity: string;
}

export default function Navbar({ sseConnected, ledgerIntegrity }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <ShieldCheck className="h-6 w-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                SourceTrace
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.4 Core
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Zero-Trust Scope-3 & Multi-Tier ESG Integrity Ledger
            </p>
          </div>
        </div>

        {/* Live System Badges */}
        <div className="flex items-center space-x-3">
          {/* DEFRA Engine Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">GHG Standard:</span>
            <span className="font-semibold text-cyan-300">DEFRA 2024 / GLEC</span>
          </div>

          {/* Cryptographic Ledger Health */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-medium hidden sm:inline">Ledger Chain:</span>
            <span className="font-mono font-semibold text-emerald-400 text-[11px]">
              {ledgerIntegrity === "VERIFIED_TAMPER_EVIDENT" ? "SHA-256 INTACT" : ledgerIntegrity}
            </span>
          </div>

          {/* Real-time SSE connection indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              {sseConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  sseConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              ></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px] hidden sm:inline">
              {sseConnected ? "LIVE SSE" : "POLLING"}
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>ZEPHORIA 2K26 PS-06</span>
          </div>
        </div>
      </div>
    </header>
  );
}
