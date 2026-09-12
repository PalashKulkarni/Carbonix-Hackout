import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import type { Edge, Node, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { Building2, ChevronRight, FolderTree, Maximize2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { HierarchyNode } from '../types';

/* ─── Constants ─────────────────────────────────────────── */

const NODE_W = 220;
const NODE_H = 106;
const H_GAP  = 60;
const V_GAP  = 80;

interface HierarchyPageProps {
  period: string;
}

/* ─── Tier theme ─────────────────────────────────────────── */

const TIER_THEME: Record<number, { border: string; bg: string; label: string; edge: string }> = {
  0: { border: '#1B3A2D', bg: '#1B3A2D', label: '#7A9B8A', edge: '#2D6A4F' },
  1: { border: '#2D6A4F', bg: '#F0F7F4', label: '#2D6A4F', edge: '#52B788' },
  2: { border: '#52B788', bg: '#F4FAF7', label: '#52B788', edge: '#95D5B2' },
  3: { border: '#95D5B2', bg: '#F8FCF9', label: '#74C69D', edge: '#B7E4C7' },
};

/* ─── Custom node data shape ─────────────────────────────── */

interface SupplierNodeData {
  name: string;
  tier: number;
  isRoot: boolean;
  total_co2e_kg: number;
  carbon_risk: string;
  supplier_id: string;
  onNavigate: (id: string) => void;
}

/* ─── Custom node component ──────────────────────────────── */

const SupplierNode: React.FC<NodeProps<SupplierNodeData>> = ({ data }) => {
  const safeTier = Math.max(0, Math.min(data.tier ?? 0, 3));
  const t = TIER_THEME[safeTier];
  const tonnes = Math.round(((data.total_co2e_kg ?? 0) / 1000) * 10) / 10;

  return (
    <>
      {!data.isRoot && (
        <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}

      <div
        style={{
          width: NODE_W,
          background: t.bg,
          border: `1px solid ${data.isRoot ? t.border : '#e5e2dc'}`,
          borderLeft: `4px solid ${t.border}`,
          borderRadius: 10,
          boxShadow: data.isRoot ? '0 4px 20px rgba(27,58,45,0.25)' : '0 1px 6px rgba(0,0,0,0.07)',
          cursor: data.isRoot ? 'default' : 'pointer',
        }}
      >
        <div style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {data.isRoot
                ? <Building2 size={13} color={t.label} />
                : <ChevronRight size={12} color={t.label} />
              }
              <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.label }}>
                {data.isRoot ? 'Buyer (Root)' : `Tier ${safeTier} Supplier`}
              </span>
            </div>
            {!data.isRoot && <Badge risk={(data.carbon_risk || 'low') as any} size="sm" />}
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: data.isRoot ? '#fff' : '#1B3A2D', lineHeight: 1.35, marginBottom: 8 }}>
            {data.name || 'Unknown'}
          </div>

          <div style={{ borderTop: `1px dashed ${data.isRoot ? 'rgba(255,255,255,0.2)' : '#e5e2dc'}`, paddingTop: 7, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: data.isRoot ? '#6ee7b7' : '#1B3A2D' }}>
              {tonnes.toLocaleString()} tCO₂e
            </span>
            {!data.isRoot && (
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#a8a29e' }}>View detail →</span>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </>
  );
};

const NODE_TYPES = { supplier: SupplierNode };

/* ─── Layout algorithm ───────────────────────────────────── */

function subtreeWidth(node: HierarchyNode): number {
  if (!node.children || node.children.length === 0) return NODE_W;
  const total = node.children.reduce((s, c) => s + subtreeWidth(c) + H_GAP, 0) - H_GAP;
  return Math.max(NODE_W, total);
}

type RawRoot = { 
  org_id?: string; supplier_id?: string; 
  org_name?: string; name?: string; 
  total_co2e_kg?: number; 
  children?: HierarchyNode[];
};

function buildGraph(
  rawRoot: RawRoot,
  onNavigate: (id: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Place root at centre
  const rootId = rawRoot.org_id || rawRoot.supplier_id || '__root__';
  nodes.push({
    id: rootId,
    type: 'supplier',
    position: { x: -NODE_W / 2, y: 0 },
    data: {
      name: rawRoot.org_name || rawRoot.name || 'Organisation Root',
      tier: 0,
      isRoot: true,
      total_co2e_kg: rawRoot.total_co2e_kg ?? 0,
      carbon_risk: 'low',
      supplier_id: rootId,
      onNavigate,
    } satisfies SupplierNodeData,
  });

  function walk(node: HierarchyNode, xCenter: number, yOffset: number, parentId: string) {
    const id = node.supplier_id;
    const nodeTier = Math.max(1, node.tier ?? 1); // ensure minimum tier 1 for children
    
    nodes.push({
      id,
      type: 'supplier',
      position: { x: xCenter - NODE_W / 2, y: yOffset },
      data: {
        name: node.name,
        tier: nodeTier,
        isRoot: false,
        total_co2e_kg: node.total_co2e_kg,
        carbon_risk: node.carbon_risk ?? 'low',
        supplier_id: id,
        onNavigate,
      } satisfies SupplierNodeData,
    });

    const parentTier = Math.max(0, Math.min(nodeTier - 1, 3));
    const parentTheme = TIER_THEME[parentTier];
    
    edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      type: 'smoothstep',
      style: { stroke: parentTheme.edge, strokeWidth: 2, opacity: 0.7 },
    });

    if (!node.children || node.children.length === 0) return;
    const totalW = node.children.reduce((s, c) => s + subtreeWidth(c) + H_GAP, 0) - H_GAP;
    let cx = xCenter - totalW / 2;
    for (const child of node.children) {
      const cw = subtreeWidth(child);
      walk(child, cx + cw / 2, yOffset + NODE_H + V_GAP, id);
      cx += cw + H_GAP;
    }
  }

  // Layout Tier-1 children centred under root
  const children = rawRoot.children ?? [];
  const totalW = children.reduce((s, c) => s + subtreeWidth(c) + H_GAP, 0) - H_GAP;
  let cx = -totalW / 2;
  for (const child of children) {
    const cw = subtreeWidth(child);
    walk(child, cx + cw / 2, NODE_H + V_GAP, rootId);
    cx += cw + H_GAP;
  }

  return { nodes, edges };
}

/* ─── Fit-view button (must live INSIDE ReactFlow) ───────── */

const FitViewButton: React.FC = () => {
  const { fitView } = useReactFlow();
  return (
    <button
      onClick={() => fitView({ padding: 0.18, duration: 400 })}
      style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: '#fff', border: '1px solid #e5e2dc', borderRadius: 8,
        padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontFamily: 'monospace', color: '#1B3A2D',
        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      <Maximize2 size={13} /> Fit view
    </button>
  );
};

/* ─── Inner canvas component (owns all RF hooks) ────────── */

interface FlowCanvasProps {
  rawRoot: RawRoot;
  onNavigate: (id: string) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ rawRoot, onNavigate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    try {
      const { nodes: ns, edges: es } = buildGraph(rawRoot, onNavigate);
      setNodes(ns);
      setEdges(es);
    } catch (err) {
      console.error("Failed to build graph:", err);
    }
  }, [rawRoot, onNavigate, setNodes, setEdges]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as SupplierNodeData;
    if (!data.isRoot && data.supplier_id) {
      data.onNavigate(data.supplier_id);
    }
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.15}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#D6D1C9" />
      <Controls showInteractive={false} style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.1)', borderRadius: 8 }} />
      <MiniMap
        nodeColor={(n) => {
          const safeTier = Math.max(0, Math.min((n.data as SupplierNodeData).tier ?? 0, 3));
          return TIER_THEME[safeTier].border;
        }}
        maskColor="rgba(247,245,240,0.75)"
        style={{ borderRadius: 8, border: '1px solid #e5e2dc' }}
      />
      <FitViewButton />
    </ReactFlow>
  );
};

/* ─── Page ───────────────────────────────────────────────── */

import { ErrorBoundary } from '../components/ErrorBoundary';

export const HierarchyPage: React.FC<HierarchyPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [rawRoot, setRawRoot] = useState<RawRoot | null>(null);
  const [loading, setLoading] = useState(true);

  const onNavigate = useCallback((id: string) => navigate(`/app/suppliers/${id}`), [navigate]);

  useEffect(() => {
    setLoading(true);
    api.getHierarchy(period).then((res) => {
      setRawRoot(res as unknown as RawRoot);
      setLoading(false);
    });
  }, [period]);

  const LEGEND = [
    { color: '#1B3A2D', label: 'Buyer Root' },
    { color: '#2D6A4F', label: 'Tier 1' },
    { color: '#52B788', label: 'Tier 2' },
    { color: '#95D5B2', label: 'Tier 3' },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div
          className="rounded-xl p-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #1A3D2E 0%, #254F3E 100%)', border: '1px solid #2D6A4F' }}
        >
          <div>
            <div className="flex items-center space-x-2">
              <FolderTree className="w-5 h-5" style={{ color: '#8FB3A0' }} />
              <h2 className="font-heading text-xl font-bold text-white">
                Multi-Tier Supply Chain Hierarchy
              </h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Scroll to zoom · Drag to pan · Click any supplier to view detail
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono-data" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {LEGEND.map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Risk
            </span>
          </div>
        </div>

        {/* Canvas — dark mission-control background */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ height: 640, background: '#12281F', border: '1px solid #1A3828', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.4)' }}
        >
          {loading || !rawRoot ? (
            <div className="flex items-center justify-center h-full font-mono-data text-xs" style={{ color: '#3A6A4F' }}>
              Constructing multi-tier supply chain tree…
            </div>
          ) : (
            <ReactFlowProvider>
              <FlowCanvas rawRoot={rawRoot} onNavigate={onNavigate} />
            </ReactFlowProvider>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

