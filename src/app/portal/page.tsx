"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import SubmissionPortal from "@/components/SubmissionPortal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, Building, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function SupplierPortalPage() {
  const queryClient = useQueryClient();
  const { user, role, roleLabel } = useAuth();

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return res.json();
    },
  });

  const suppliers = suppliersData?.suppliers || [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase interactive-badge font-mono">
              Gateway
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-300 text-xs font-medium">{roleLabel}</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Vendor Portal</h1>
          <p className="text-xs text-slate-400">
            Submit logistics manifests, emissions data, and compliance certificates into the verification pipeline.
          </p>
        </div>
      </div>

      <SubmissionPortal
        suppliers={suppliers}
        onSubmissionComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["suppliers"] });
          queryClient.invalidateQueries({ queryKey: ["audit"] });
        }}
      />
    </AppLayout>
  );
}
