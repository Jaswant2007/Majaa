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
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              Directory & Trust Index
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs">Phase 4 Enterprise UX</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Supplier 360 Registry</h1>
          <p className="text-xs text-slate-400">
            Real-time audit registry of all 20 Tier-1, Tier-2, and Tier-3 vendors across global operations. Click any supplier to view their 360° compliance dossier.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-1.5">
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
