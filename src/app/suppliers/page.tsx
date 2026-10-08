"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import SupplierTable from "@/components/SupplierTable";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Download, ShieldCheck } from "lucide-react";

export default function Supplier360Page() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to load suppliers");
      return res.json();
    },
  });

  const suppliers = data?.suppliers || [];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase tracking-wider interactive-badge font-mono">
              Directory
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Continuous Trust Index</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Suppliers</h1>
          <p className="text-xs text-slate-400">
            Multi-tier audit registry with continuous trust scoring and compliance dossiers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-1.5 card-hover">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Active Suppliers: <strong>{suppliers.length}</strong></span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading supplier registry...</div>
      ) : (
        <SupplierTable
          suppliers={suppliers}
          onSelectSupplier={(s) => setSelectedSupplierId(s.id)}
        />
      )}

      {/* Supplier 360 Drawer */}
      <Supplier360Drawer
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </AppLayout>
  );
}
