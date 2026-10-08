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
  ShieldAlert,
  Scale,
  Calculator,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
      { href: "/", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      { href: "/supply-chain", label: "Supply Chain", icon: Network, permission: "supply_chain:view" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/suppliers", label: "Suppliers", icon: Building2, permission: "suppliers:view" },
      { href: "/documents", label: "Documents", icon: FileSearch, permission: "documents:verify" },
      { href: "/portal", label: "Vendor Portal", icon: UploadCloud, permission: "portal:submit" },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: "/compliance", label: "Compliance", icon: ShieldCheck, permission: "compliance:adjudicate" },
      { href: "/alerts", label: "Alerts", icon: AlertTriangle, permission: "alerts:resolve", badge: "!" },
      { href: "/fraud-center", label: "Fraud Center", icon: ShieldAlert, permission: "compliance:adjudicate" },
      { href: "/audit", label: "Audit Ledger", icon: Layers, permission: "audit:view" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/scope3", label: "Scope-3 Math", icon: Calculator, permission: "scope3:calculate" },
      { href: "/simulator", label: "Simulator", icon: Sliders, permission: "scope3:calculate" },
      { href: "/compare", label: "Compare", icon: Scale, permission: "suppliers:view" },
      { href: "/assistant", label: "AI Copilot", icon: Bot, permission: "assistant:access" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, permissions } = useAuth();

  return (
    <aside
      className="w-64 flex flex-col shrink-0 select-none hidden lg:flex min-h-screen"
      style={{
        background: "var(--surface-card)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Brand Header */}
      <div
        className="h-16 px-5 flex items-center space-x-3"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
          style={{ background: "var(--color-tertiary)" }}
        >
          <ShieldCheck className="h-5 w-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <span
            className="font-extrabold text-lg tracking-tight"
            style={{ color: "var(--color-tertiary)" }}
          >
            SourceTrace
          </span>
          <span className="text-[10px] block font-mono" style={{ color: "var(--text-muted)" }}>
            Zephoria 2K26 • PS-06
          </span>
        </div>
      </div>

      {/* Nav Sections */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
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
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 group hover:translate-x-1"
                    style={{
                      background: isActive ? "var(--color-primary)" : "transparent",
                      color: isActive
                        ? "var(--color-tertiary)"
                        : isAllowed
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                      border: isActive ? "1px solid var(--border-color)" : "1px solid transparent",
                      opacity: !isAllowed ? 0.6 : 1,
                    }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className="h-4 w-4 transition group-hover:scale-110 duration-200"
                        style={{
                          color: isActive ? "var(--color-tertiary)" : "var(--text-muted)",
                        }}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.badge && (
                        <span
                          className="h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse"
                          style={{
                            background: "hsla(62, 80%, 20%, 0.15)",
                            color: "var(--color-accent)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {!isAllowed && (
                        <span
                          className="text-[9px] uppercase px-1 rounded font-mono"
                          style={{
                            background: "var(--color-primary)",
                            color: "var(--text-muted)",
                          }}
                        >
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
      <div className="p-3.5" style={{ borderTop: "1px solid var(--border-color)" }}>
        <div
          className="p-2.5 rounded-xl text-[11px]"
          style={{
            background: "var(--color-primary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <span
            className="block text-[10px] uppercase font-bold tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Tenant Workspace
          </span>
          <span className="font-bold block truncate mt-0.5" style={{ color: "var(--text-primary)" }}>
            Zephoria Industrial AG
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
            CHE-882.109.344
          </span>
        </div>
      </div>
    </aside>
  );
}
