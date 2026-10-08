"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import ReactFlowSupplyChain from "@/components/ReactFlowSupplyChain";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import { useQuery } from "@tanstack/react-query";
import { Network, Filter, Download, Info } from "lucide-react";

export default function SupplyChainExplorerPage() {
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
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold uppercase tracking-wider">
              Multi-Tier Lineage
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs">Phase 4 Interactive Topology</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Multi-Tier Supply Chain Explorer</h1>
          <p className="text-xs text-slate-400">
            Interactive React Flow lineage: Enterprise → Tier-1 → Tier-2 → Tier-3. Click any node to open its full 360° compliance profile.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Entities in Lineage: <strong className="text-emerald-400">{suppliers.length}</strong>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading supply chain topology graph...</div>
      ) : (
        <ReactFlowSupplyChain
          suppliers={suppliers}
          onSelectSupplier={(id) => setSelectedSupplierId(id)}
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
