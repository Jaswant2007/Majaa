"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import AuditLedgerView from "@/components/AuditLedgerView";
import { useQuery } from "@tanstack/react-query";

export default function AuditLedgerPage() {
  const { data, refetch } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const res = await fetch("/api/audit");
      return res.json();
    },
  });

  const logs = data?.auditLedger || [];
  const integrityStatus = data?.ledgerIntegrityStatus || "VERIFIED_TAMPER_EVIDENT";

  return (
    <AppLayout>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase">
              Verifiable Disclosure Trail
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Cryptographic ESG Audit Ledger</h1>
          <p className="text-xs text-slate-400">
            Rule 8: Never silently overwrite supplier data. Every state mutation produces an immutable SHA-256 audit entry.
          </p>
        </div>
      </div>

      <AuditLedgerView logs={logs} integrityStatus={integrityStatus} onRefresh={refetch} />
    </AppLayout>
  );
}
