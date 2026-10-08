"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Role, ROLE_LABELS } from "@/lib/auth";
import {
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  Search,
  Building,
  Check,
} from "lucide-react";

const ROLE_THEMES: Record<Role, { pill: string; badge: string }> = {
  ENTERPRISE_ADMIN: {
    pill: "border-purple-500/40 bg-purple-950/30 text-purple-300",
    badge: "bg-purple-500 text-slate-950",
  },
  COMPLIANCE_OFFICER: {
    pill: "border-amber-500/40 bg-amber-950/30 text-amber-300",
    badge: "bg-amber-500 text-slate-950",
  },
  SUSTAINABILITY_MANAGER: {
    pill: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300",
    badge: "bg-emerald-500 text-slate-950",
  },
  SUPPLIER_USER: {
    pill: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300",
    badge: "bg-cyan-500 text-slate-950",
  },
};

export default function Topbar() {
  const { user, role, roleLabel, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rolesList: { role: Role; label: string; name: string }[] = [
    { role: "ENTERPRISE_ADMIN", label: "Enterprise Admin", name: "Elena Rostova" },
    { role: "COMPLIANCE_OFFICER", label: "Compliance Officer", name: "Marcus Vance" },
    { role: "SUSTAINABILITY_MANAGER", label: "Sustainability Manager", name: "Dr. Anya Sharma" },
    { role: "SUPPLIER_USER", label: "Supplier User", name: "Jan de Vries (Apex Global)" },
  ];

  const currentTheme = ROLE_THEMES[role] || ROLE_THEMES.ENTERPRISE_ADMIN;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 w-full">
      {/* Search Bar */}
      <div className="flex items-center space-x-3 w-72">
        <div className="relative w-full">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manifests, suppliers, certs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Ledger Hash Status */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <Layers className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">Ledger:</span>
          <span className="font-mono text-emerald-400 font-bold text-[11px]">SHA-256 SECURED</span>
        </div>

        {/* Interactive RBAC Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${currentTheme.pill} hover:border-slate-600`}
          >
            <div className="h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-slate-800 text-white">
              {user?.name?.slice(0, 2).toUpperCase() || "EA"}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] block text-slate-400 leading-none">Role Switcher:</span>
              <span className="font-bold text-xs">{roleLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Enterprise Role Persona
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  RBAC policy controls live query & adjudication capabilities.
                </p>
              </div>

              {rolesList.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchRole(item.role);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between hover:scale-[1.01] ${
                    role === item.role
                      ? "bg-emerald-950/40 text-emerald-300 font-bold border border-emerald-800/40"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <span className="block font-bold">{item.label}</span>
                    <span className="block text-[11px] text-slate-400">{item.name}</span>
                  </div>
                  {role === item.role && <Check className="h-4 w-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
