"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  LayoutDashboard,
  Network,
  Building2,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Bot,
  UploadCloud,
  Sliders,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Executive Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { href: "/supply-chain", label: "Supply Chain Map", icon: Network, permission: "supply_chain:view" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/suppliers", label: "Supplier 360", icon: Building2, permission: "suppliers:view" },
      { href: "/documents", label: "Document Intelligence", icon: FileSearch, permission: "documents:verify" },
      { href: "/portal", label: "Supplier Portal", icon: UploadCloud, permission: "portal:submit" },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: "/compliance", label: "Compliance Center", icon: ShieldCheck, permission: "compliance:adjudicate" },
      { href: "/alerts", label: "Risk & Alerts", icon: AlertTriangle, permission: "alerts:resolve", badge: "!" },
      { href: "/audit", label: "Audit Ledger", icon: Layers, permission: "audit:view" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/simulator", label: "Carbon Simulator", icon: Sliders, permission: "scope3:calculate" },
      { href: "/assistant", label: "AI Assistant", icon: Bot, permission: "assistant:access" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, permissions } = useAuth();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 select-none hidden lg:flex min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-950/90">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
          <ShieldCheck className="h-5 w-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
            SourceTrace
          </span>
          <span className="text-[10px] block font-mono text-slate-400">
            Zephoria 2K26 • PS-06
          </span>
        </div>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {section.title}
            </div>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const isAllowed = permissions.includes(item.permission) || role === "ENTERPRISE_ADMIN";
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                      isActive
                        ? "bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                        : isAllowed
                        ? "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                        : "text-slate-600 hover:text-slate-400 hover:bg-slate-900/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`h-4 w-4 transition ${
                          isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span className="h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                      {!isAllowed && (
                        <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-500 font-mono">
                          Locked
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Tenant Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px]">
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
            Tenant Workspace
          </span>
          <span className="text-white font-bold block truncate mt-0.5">
            Zephoria Industrial AG
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            CHE-882.109.344
          </span>
        </div>
      </div>
    </aside>
  );
}
