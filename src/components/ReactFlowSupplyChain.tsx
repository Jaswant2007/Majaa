"use client";

import React, { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Sparkles,
  CloudRain,
  ExternalLink,
} from "lucide-react";

// Custom Enterprise Root Node
function EnterpriseNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 text-white min-w-[260px] text-center">
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-400" />
      <div className="flex items-center justify-center space-x-2">
        <Building2 className="h-5 w-5 text-emerald-400" />
        <span className="font-black text-sm tracking-wide uppercase">{data.label}</span>
      </div>
      <p className="text-[11px] text-slate-300 font-mono mt-1">Enterprise Reporting Tenant</p>
      <div className="mt-2 pt-2 border-t border-emerald-500/30 flex justify-between text-[10px] font-mono text-emerald-300">
        <span>{data.supplierCount} Direct & Sub-Vendors</span>
        <span>{data.totalEmissions} t CO₂e</span>
      </div>
    </div>
  );
}

// Custom Supplier Node (Tier 1, 2, 3)
function SupplierNode({ data }: { data: any }) {
  const getBorderColor = () => {
    if (data.isBlacklisted || data.status === "BLACKLISTED" || data.trustScore < 50) {
      return "border-rose-500 bg-rose-950/40 text-rose-300 hover:border-rose-400 shadow-rose-950/50";
    }
    if (data.status === "REQUIRES_REVIEW" || data.status === "HIGH_RISK" || data.trustScore < 75) {
      return "border-amber-500 bg-amber-950/40 text-amber-300 hover:border-amber-400 shadow-amber-950/50";
    }
    return "border-emerald-500 bg-emerald-950/30 text-emerald-300 hover:border-emerald-400 shadow-emerald-950/50";
  };

  const getComplianceBadge = () => {
    if (data.isBlacklisted || data.trustScore < 50) {
      return { text: "HIGH RISK", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
    }
    if (data.status === "REQUIRES_REVIEW" || data.trustScore < 75) {
      return { text: "ACTION REQUIRED", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    }
    return { text: "COMPLIANT", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
  };

  const badge = getComplianceBadge();

  return (
    <div
      onClick={data.onClick}
      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer min-w-[220px] max-w-[240px] shadow-lg backdrop-blur-md ${getBorderColor()}`}
    >
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-cyan-400" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-emerald-400" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[9px] font-bold font-mono text-slate-300">
          Tier {data.tier}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      <h4 className="font-bold text-xs text-white truncate" title={data.name}>
        {data.name}
      </h4>
      <p className="text-[10px] text-slate-400 font-mono truncate">{data.registrationNo}</p>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
        <div>
          <span className="text-slate-500 block text-[9px]">TRUST SCORE</span>
          <span className="font-black text-white">{data.trustScore?.toFixed(1) || 0}</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[9px]">SCOPE-3</span>
          <span className="font-black text-emerald-400">{data.emissionsTonnes || 0} t</span>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  enterprise: EnterpriseNode,
  supplier: SupplierNode,
};

interface ReactFlowSupplyChainProps {
  suppliers: any[];
  onSelectSupplier: (supplierId: string) => void;
}

export default function ReactFlowSupplyChain({
  suppliers,
  onSelectSupplier,
}: ReactFlowSupplyChainProps) {
  // Build Nodes & Edges from suppliers list
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Calculate total emissions
    const totalEmissionsTonnes = Number(
      (
        suppliers
          .flatMap((s) => s.shipments || [])
          .flatMap((shp) => shp.calculations || [])
          .reduce((sum, c) => sum + (c.result || 0), 0) / 1000
      ).toFixed(2)
    );

    // 1. Root Enterprise Node
    nodes.push({
      id: "enterprise-root",
      type: "enterprise",
      position: { x: 500, y: 20 },
      data: {
        label: "Zephoria Group Global",
        supplierCount: suppliers.length,
        totalEmissions: totalEmissionsTonnes,
      },
    });

    const tier1 = suppliers.filter((s) => s.tier === 1);
    const tier2 = suppliers.filter((s) => s.tier === 2);
    const tier3 = suppliers.filter((s) => s.tier === 3);

    // 2. Position Tier 1 Nodes (Horizontal row)
    const t1Spacing = 280;
    const t1StartX = Math.max(0, 500 - ((tier1.length - 1) * t1Spacing) / 2);

    tier1.forEach((s, idx) => {
      const posX = t1StartX + idx * t1Spacing;
      const posY = 170;

      const emissionsTonnes = Number(
        (
          (s.shipments || [])
            .flatMap((shp: any) => shp.calculations || [])
            .reduce((sum: number, c: any) => sum + (c.result || 0), 0) / 1000
        ).toFixed(2)
      );

      nodes.push({
        id: s.id,
        type: "supplier",
        position: { x: posX, y: posY },
        data: {
          ...s,
          emissionsTonnes,
          onClick: () => onSelectSupplier(s.id),
        },
      });

      // Edge from Enterprise to Tier 1
      edges.push({
        id: `e-root-${s.id}`,
        source: "enterprise-root",
        target: s.id,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
      });
    });

    // 3. Position Tier 2 Nodes
    const t2Spacing = 270;
    const t2StartX = Math.max(0, 500 - ((tier2.length - 1) * t2Spacing) / 2);

    tier2.forEach((s, idx) => {
      const posX = t2StartX + idx * t2Spacing;
      const posY = 380;

      const emissionsTonnes = Number(
        (
          (s.shipments || [])
            .flatMap((shp: any) => shp.calculations || [])
            .reduce((sum: number, c: any) => sum + (c.result || 0), 0) / 1000
        ).toFixed(2)
      );

      nodes.push({
        id: s.id,
        type: "supplier",
        position: { x: posX, y: posY },
        data: {
          ...s,
          emissionsTonnes,
          onClick: () => onSelectSupplier(s.id),
        },
      });

      // Edge from parent Tier 1 (or default to nearest T1)
      const parentId = s.parentSupplierId || tier1[idx % tier1.length]?.id;
      if (parentId) {
        edges.push({
          id: `e-${parentId}-${s.id}`,
          source: parentId,
          target: s.id,
          animated: s.trustScore < 70,
          style: { stroke: s.trustScore < 70 ? "#f59e0b" : "#06b6d4", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: s.trustScore < 70 ? "#f59e0b" : "#06b6d4",
          },
        });
      }
    });

    // 4. Position Tier 3 Nodes
    const t3Spacing = 260;
    const t3StartX = Math.max(0, 500 - ((tier3.length - 1) * t3Spacing) / 2);

    tier3.forEach((s, idx) => {
      const posX = t3StartX + idx * t3Spacing;
      const posY = 590;

      const emissionsTonnes = Number(
        (
          (s.shipments || [])
            .flatMap((shp: any) => shp.calculations || [])
            .reduce((sum: number, c: any) => sum + (c.result || 0), 0) / 1000
        ).toFixed(2)
      );

      nodes.push({
        id: s.id,
        type: "supplier",
        position: { x: posX, y: posY },
        data: {
          ...s,
          emissionsTonnes,
          onClick: () => onSelectSupplier(s.id),
        },
      });

      // Edge from Tier 2 parent (or nearest T2)
      const parentId = s.parentSupplierId || tier2[idx % tier2.length]?.id;
      if (parentId) {
        edges.push({
          id: `e-${parentId}-${s.id}`,
          source: parentId,
          target: s.id,
          animated: s.blacklisted || s.trustScore < 60,
          style: {
            stroke: s.blacklisted ? "#ef4444" : s.trustScore < 70 ? "#f59e0b" : "#64748b",
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: s.blacklisted ? "#ef4444" : s.trustScore < 70 ? "#f59e0b" : "#64748b",
          },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [suppliers, onSelectSupplier]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[680px] w-full rounded-2xl glass-panel border border-slate-800 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs flex items-center space-x-3 pointer-events-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-mono">Compliant</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 font-mono">Action Required</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-300 font-mono">High Risk / Blacklisted</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background color="#1e293b" gap={18} size={1} />
        <Controls className="bg-slate-900 border-slate-800 text-white rounded-xl" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "enterprise") return "#10b981";
            return "#06b6d4";
          }}
          className="bg-slate-950/90 border border-slate-800 rounded-xl"
        />
      </ReactFlow>
    </div>
  );
}
