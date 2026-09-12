import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Building2, Layers } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { HierarchyNode } from '../types';


interface HierarchyPageProps {
  period: string;
}

export const HierarchyPage: React.FC<HierarchyPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await api.getHierarchy(period);
      setHierarchy(res);
      setLoading(false);
    };
    loadData();
  }, [period]);

  if (loading || !hierarchy) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 font-mono-data text-xs">
        Constructing multi-tier supply chain tree...
      </div>
    );
  }

  const renderNode = (node: HierarchyNode, isRoot = false) => {
    const totalTonnes = Math.round((node.total_co2e_kg / 1000) * 10) / 10;

    return (
      <div key={node.supplier_id} className="flex flex-col items-start space-y-4 my-2">
        {/* Node Box */}
        <div
          onClick={() => !isRoot && navigate(`/app/suppliers/${node.supplier_id}`)}
          className={`p-4 rounded-lg border transition-all ${
            isRoot
              ? 'bg-[#1B3A2D] text-white border-[#254F3E] w-80 shadow-md cursor-default'
              : 'carbonix-card bg-white hover:border-[#1B3A2D] w-72 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isRoot ? <Building2 className="w-4 h-4 text-[#7A9B8A]" /> : <Layers className="w-4 h-4 text-stone-400" />}
              <span className={`font-mono-data text-[10px] uppercase font-bold ${isRoot ? 'text-[#7A9B8A]' : 'text-stone-500'}`}>
                {isRoot ? 'Buyer Organization Root' : `Tier ${node.tier}`}
              </span>
            </div>
            {!isRoot && <Badge risk={node.carbon_risk} size="sm" />}
          </div>

          <h4 className={`font-heading font-bold text-base mt-1.5 ${isRoot ? 'text-white' : 'text-[#1B3A2D]'}`}>
            {node.name}
          </h4>

          <div className="flex items-baseline space-x-2 mt-2 pt-2 border-t border-dashed border-[#E1DFDA]/60">
            <span className={`font-mono-data text-sm font-bold ${isRoot ? 'text-emerald-300' : 'text-[#1B3A2D]'}`}>
              {totalTonnes.toLocaleString()} tCO₂e
            </span>
            {!isRoot && (
              <span className="text-[10px] text-stone-500 font-mono-data hover:underline">
                View detail →
              </span>
            )}
          </div>
        </div>

        {/* Children Sub-trees */}
        {node.children && node.children.length > 0 && (
          <div className="pl-6 border-l-2 border-dashed border-[#7A9B8A]/40 space-y-4 ml-4">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="carbonix-card p-6 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <FolderTree className="w-5 h-5 text-[#1B3A2D]" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              Multi-Tier Supply Chain Hierarchy Tree
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1">
            Visualizing dependency tree topology from Tier 1 buyers down to sub-tier suppliers. Click any node for detail breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono-data">
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#1B3A2D] mr-1.5"></span> Org Root</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-600 mr-1.5"></span> High Risk Node</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-600 mr-1.5"></span> Compliant Node</span>
        </div>
      </div>

      {/* Interactive Tree Workspace */}
      <div className="carbonix-card p-8 bg-[#F7F5F0]/60 overflow-x-auto min-h-[500px]">
        {renderNode(hierarchy, true)}
      </div>
    </div>
  );
};
