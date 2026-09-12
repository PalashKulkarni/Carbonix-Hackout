import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, FolderTree, Lightbulb, Zap, Truck, Box, Factory, PackageCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { Supplier, Recommendation, ElectricitySource, TransportMode, MaterialCode } from '../types';


export const SupplierDetailPage: React.FC = () => {
  const { supplier_id } = useParams<{ supplier_id: string }>();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Editable form state
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    if (!supplier_id) return;
    const loadDetail = async () => {
      setLoading(true);
      const data = await api.getSupplierById(supplier_id);
      if (data) {
        setSupplier(data);
        setFormData(data);
        const recRes = await api.getRecommendations('2025', supplier_id);
        setRecs(recRes.items);
      }
      setLoading(false);
    };
    loadDetail();
  }, [supplier_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier_id) return;
    setSaving(true);
    const updated = await api.updateSupplier(supplier_id, formData);
    setSupplier(updated);
    setFormData(updated);
    setSaving(false);
    setMessage('Emissions math updated & recalculated!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading || !supplier) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 font-mono-data text-xs">
        Loading supplier telemetry...
      </div>
    );
  }

  const totalInTonnes = supplier.total_co2e_kg
    ? Math.round((supplier.total_co2e_kg / 1000) * 100) / 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Navigation & Header Card */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/suppliers')}
          className="inline-flex items-center text-xs font-mono-data text-stone-600 hover:text-[#1B3A2D]"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Suppliers Directory
        </button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<MapPin className="w-3.5 h-3.5" />}
            onClick={() => navigate('/app/map')}
          >
            Locate on Map
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FolderTree className="w-3.5 h-3.5" />}
            onClick={() => navigate('/app/hierarchy')}
          >
            View in Hierarchy
          </Button>

        </div>
      </div>

      {/* Supplier Profile Banner */}
      <div className="carbonix-card p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="font-heading text-2xl font-bold text-[#1B3A2D]">{supplier.name}</h2>
            <Badge tier={supplier.tier} size="sm" />
            <Badge risk={supplier.carbon_risk || 'medium'} size="sm" />
            <Badge dataSource={supplier.data_source} size="sm" />
          </div>
          <p className="text-xs font-mono-data text-stone-500 mt-1">
            Supplier ID: <span className="font-semibold text-stone-800">{supplier.supplier_id}</span> • Location: {supplier.location_label} ({supplier.latitude}, {supplier.longitude})
          </p>
        </div>

        <div className="text-right bg-[#1B3A2D] text-[#F7F5F0] p-4 rounded-lg border border-[#254F3E] min-w-[200px]">
          <span className="font-mono-data text-[10px] text-[#7A9B8A] uppercase tracking-wider block font-semibold">Total Carbon Footprint</span>
          <span className="font-heading text-3xl font-bold">{totalInTonnes}</span>
          <span className="font-mono-data text-xs text-[#7A9B8A] ml-1">tCO₂e</span>
          <p className="font-mono-data text-[10px] text-stone-300 mt-0.5">
            Rank #{supplier.rank || 1} • {supplier.intensity_kg_per_unit?.toLocaleString()} kg CO₂e/unit
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-data rounded">
          {message}
        </div>
      )}

      {/* 5-Category Emission Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="carbonix-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="font-mono-data text-[10px] uppercase font-bold">Energy</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-heading text-xl font-bold text-[#1B3A2D]">
            {supplier.energy_co2e_kg ? (supplier.energy_co2e_kg / 1000).toFixed(2) : '0'} t
          </p>
          <span className="font-mono-data text-[10px] text-stone-500">
            {supplier.electricity_source}
          </span>
        </div>

        <div className="carbonix-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="font-mono-data text-[10px] uppercase font-bold">Transport</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="font-heading text-xl font-bold text-[#1B3A2D]">
            {supplier.transport_co2e_kg ? (supplier.transport_co2e_kg / 1000).toFixed(2) : '0'} t
          </p>
          <span className="font-mono-data text-[10px] text-stone-500">
            {supplier.transport_distance_km} km ({supplier.transport_mode})
          </span>
        </div>

        <div className="carbonix-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="font-mono-data text-[10px] uppercase font-bold">Material</span>
            <Box className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-heading text-xl font-bold text-[#1B3A2D]">
            {supplier.material_co2e_kg ? (supplier.material_co2e_kg / 1000).toFixed(2) : '0'} t
          </p>
          <span className="font-mono-data text-[10px] text-stone-500 capitalize">
            {supplier.material_code} ({supplier.material_quantity_kg} kg)
          </span>
        </div>

        <div className="carbonix-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="font-mono-data text-[10px] uppercase font-bold">Manufacturing</span>
            <Factory className="w-4 h-4 text-rose-500" />
          </div>
          <p className="font-heading text-xl font-bold text-[#1B3A2D]">
            {supplier.manufacturing_co2e_kg ? (supplier.manufacturing_co2e_kg / 1000).toFixed(2) : '0'} t
          </p>
          <span className="font-mono-data text-[10px] text-stone-500">
            {supplier.production_volume} {supplier.production_unit}
          </span>
        </div>

        <div className="carbonix-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="font-mono-data text-[10px] uppercase font-bold">Logistics</span>
            <PackageCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="font-heading text-xl font-bold text-[#1B3A2D]">
            {supplier.logistics_co2e_kg ? (supplier.logistics_co2e_kg / 1000).toFixed(2) : '0'} t
          </p>
          <span className="font-mono-data text-[10px] text-stone-500">
            Last-mile (50 km road)
          </span>
        </div>
      </div>

      {/* Editable Activity Fields Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="carbonix-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDA] mb-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">Supplier Activity Data (Editable)</h3>
              <p className="text-xs text-stone-500">Modifying parameters automatically triggers carbon engine recalculations.</p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Recalculating...' : 'Recalculate Emissions'}
            </Button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Material Quantity (kg)</label>
              <input
                type="number"
                value={formData.material_quantity_kg || 0}
                onChange={(e) => setFormData({ ...formData, material_quantity_kg: Number(e.target.value) })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
              />
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Material Category</label>
              <select
                value={formData.material_code || 'steel'}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value as MaterialCode })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data capitalize"
              >
                {['steel', 'aluminium', 'plastic', 'cement', 'other'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Billed Energy (kWh)</label>
              <input
                type="number"
                value={formData.energy_kwh || 0}
                onChange={(e) => setFormData({ ...formData, energy_kwh: Number(e.target.value) })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
              />
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Electricity Grid Source</label>
              <select
                value={formData.electricity_source || 'grid_mixed'}
                onChange={(e) => setFormData({ ...formData, electricity_source: e.target.value as ElectricitySource })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
              >
                <option value="grid_coal">grid_coal (0.82 kg/kWh)</option>
                <option value="grid_mixed">grid_mixed (0.45 kg/kWh)</option>
                <option value="grid_renewable">grid_renewable (0.04 kg/kWh)</option>
                <option value="onsite_solar">onsite_solar (0.00 kg/kWh)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Transport Distance (km)</label>
              <input
                type="number"
                value={formData.transport_distance_km || 0}
                onChange={(e) => setFormData({ ...formData, transport_distance_km: Number(e.target.value) })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
              />
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Transport Mode</label>
              <select
                value={formData.transport_mode || 'road'}
                onChange={(e) => setFormData({ ...formData, transport_mode: e.target.value as TransportMode })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data capitalize"
              >
                {['road', 'rail', 'sea', 'air'].map((tm) => (
                  <option key={tm} value={tm}>{tm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Production Volume</label>
              <input
                type="number"
                value={formData.production_volume || 0}
                onChange={(e) => setFormData({ ...formData, production_volume: Number(e.target.value) })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
              />
            </div>

            <div>
              <label className="block font-mono-data font-semibold text-stone-600 mb-1">Location City/Country</label>
              <input
                type="text"
                value={formData.location_label || ''}
                onChange={(e) => setFormData({ ...formData, location_label: e.target.value })}
                className="w-full p-2 border border-[#E1DFDA] rounded font-sans"
              />
            </div>
          </form>
        </div>

        {/* Specific Recommendations for this Supplier */}
        <div className="carbonix-card p-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E1DFDA] mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">Recommendations</h3>
          </div>

          {recs.length === 0 ? (
            <p className="text-xs text-stone-500 italic">No specific recommendations registered for this supplier.</p>
          ) : (
            <div className="space-y-3">
              {recs.map((rec) => (
                <div key={rec.recommendation_id} className="p-3 bg-[#F7F5F0] rounded border border-[#E1DFDA] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-data uppercase text-[10px] font-bold text-[#1B3A2D] bg-[#1B3A2D]/10 px-1.5 py-0.5 rounded">
                      {rec.action_type}
                    </span>
                    <span className="font-mono-data font-bold text-emerald-700">
                      -{(rec.delta_co2e_kg / 1000).toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <h4 className="font-semibold text-stone-800 mt-1.5">{rec.title}</h4>
                  <p className="text-stone-600 mt-1 leading-relaxed text-[11px]">{rec.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
