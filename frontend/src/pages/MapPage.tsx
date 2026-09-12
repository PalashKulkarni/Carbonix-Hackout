import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { MapSupplier } from '../types';


interface MapPageProps {
  period: string;
}

export const MapPage: React.FC<MapPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<MapSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<MapSupplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true);
      const res = await api.getMapSuppliers(period);
      setSuppliers(res.items);
      if (res.items.length > 0) {
        setSelectedSupplier(res.items[0]);
      }
      setLoading(false);
    };
    loadMapData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 font-mono-data text-xs">
        Loading geographic cartographic baselayer...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="carbonix-card p-6 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#1B3A2D]" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              Geographic Carbon Hotspot Map
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Topological supply chain node map. Marker size scales with total metric tonnes CO₂e; color encodes carbon risk level.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono-data">
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-600 mr-1.5 animate-pulse"></span> High Risk</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></span> Medium Risk</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-600 mr-1.5"></span> Low Risk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualizer Canvas (2 Columns) */}
        <div className="carbonix-card p-6 lg:col-span-2 bg-[#F7F5F0] min-h-[500px] relative overflow-hidden flex flex-col justify-between border-1.5 border-[#E1DFDA]">
          {/* Top cartographic info */}
          <div className="flex items-center justify-between z-10">
            <span className="font-mono-data text-xs bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded border border-[#E1DFDA] text-[#1B3A2D] font-semibold">
              Cartographic Grid: India Logistics Network (500 km radius)
            </span>
            <span className="font-mono-data text-xs bg-[#1B3A2D] text-[#F7F5F0] px-3 py-1 rounded">
              {suppliers.length} Pins Rendered
            </span>
          </div>

          {/* Interactive Geographic Map Pins Visualizer */}
          <div className="relative w-full h-96 bg-[#FAF8F5] rounded-lg border border-[#E1DFDA] my-4 p-4 overflow-hidden flex items-center justify-center">
            {/* SVG India Map Outline Contour */}
            <svg viewBox="0 0 500 500" className="w-full h-full opacity-20 absolute inset-0 pointer-events-none">
              <path
                d="M 150 100 Q 250 50 350 120 T 400 300 Q 300 480 200 450 T 100 250 Z"
                fill="none"
                stroke="#1B3A2D"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Interactive Pins positioned relative to coordinates */}
            {suppliers.map((sup) => {
              const isSelected = selectedSupplier?.supplier_id === sup.supplier_id;
              // Map lat/long to canvas coordinates
              const xPct = Math.min(85, Math.max(15, ((sup.longitude - 70) / 15) * 70 + 15));
              const yPct = Math.min(85, Math.max(15, ((28 - sup.latitude) / 18) * 70 + 15));

              const riskColors = {
                high: 'bg-rose-600 text-white shadow-rose-200',
                medium: 'bg-amber-500 text-white shadow-amber-200',
                low: 'bg-emerald-600 text-white shadow-emerald-200',
              };

              const pinSize = Math.max(28, Math.min(54, Math.round(sup.total_co2e_kg / 2000)));

              return (
                <div
                  key={sup.supplier_id}
                  onClick={() => setSelectedSupplier(sup)}
                  style={{ left: `${xPct}%`, top: `${yPct}%`, width: `${pinSize}px`, height: `${pinSize}px` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center font-mono-data text-[10px] font-bold shadow-lg ${
                    riskColors[sup.carbon_risk] || 'bg-[#1B3A2D] text-white'
                  } ${isSelected ? 'ring-4 ring-[#1B3A2D] scale-125 z-30' : 'hover:scale-110 z-10 opacity-90'}`}
                  title={`${sup.name} - ${(sup.total_co2e_kg / 1000).toFixed(1)} tCO₂e`}
                >
                  {(sup.total_co2e_kg / 1000).toFixed(0)}t
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-mono-data text-stone-500 text-center z-10">
            Click any geographical pin above to inspect supplier logistics node telemetry.
          </p>
        </div>

        {/* Selected Supplier Inspector Panel (1 Column) */}
        <div className="carbonix-card p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[#E1DFDA] mb-4">
              <Navigation className="w-5 h-5 text-[#1B3A2D]" />
              <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">Node Telemetry Inspector</h3>
            </div>

            {selectedSupplier ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge tier={selectedSupplier.tier} size="sm" />
                    <Badge risk={selectedSupplier.carbon_risk} size="sm" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-[#1B3A2D] mt-2">
                    {selectedSupplier.name}
                  </h3>
                  <p className="text-xs font-mono-data text-stone-500 mt-1">
                    {selectedSupplier.supplier_id}
                  </p>
                </div>

                <div className="p-4 bg-[#F7F5F0] rounded-lg border border-[#E1DFDA] space-y-2 text-xs font-mono-data">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Location Coordinates:</span>
                    <span className="font-semibold">{selectedSupplier.latitude}, {selectedSupplier.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Emissions:</span>
                    <span className="font-bold text-[#1B3A2D]">{(selectedSupplier.total_co2e_kg / 1000).toFixed(2)} tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Carbon Risk Rating:</span>
                    <span className="font-bold uppercase">{selectedSupplier.carbon_risk}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">Select a node pin on the map to inspect.</p>
            )}
          </div>

          {selectedSupplier && (
            <div className="pt-4 border-t border-[#E1DFDA]">
              <button
                onClick={() => navigate(`/app/suppliers/${selectedSupplier.supplier_id}`)}
                className="w-full py-2 bg-[#1B3A2D] text-[#F7F5F0] rounded-md font-sans text-xs font-medium hover:bg-[#12281F] flex items-center justify-center space-x-1"
              >
                <span>Open Full Supplier Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
