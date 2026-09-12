import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Upload, RefreshCw, Filter, ExternalLink, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { Supplier, MaterialCode, Tier, ElectricitySource, TransportMode } from '../types';


interface SuppliersListPageProps {
  period: string;
}

export const SuppliersListPage: React.FC<SuppliersListPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // Add Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    tier: 1 as Tier,
    parent_id: '' as string | undefined,
    material_code: 'steel' as MaterialCode,
    material_quantity_kg: 10000,
    energy_kwh: 20000,
    electricity_source: 'grid_mixed' as ElectricitySource,
    transport_distance_km: 250,
    transport_mode: 'road' as TransportMode,
    location_label: 'Mumbai, India',
    latitude: 19.076,
    longitude: 72.8777,
    production_volume: 10,
    production_unit: 'tonnes',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    const res = await api.getSuppliers(period, selectedTier || undefined, selectedRisk || undefined);
    setSuppliers(res.items);
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, [period, selectedTier, selectedRisk]);

  const handleReseedDemo = async () => {
    setLoading(true);
    const res = await api.reseedDemoData();
    setSuppliers(res.items);
    setLoading(false);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createSupplier({
      ...newSupplier,
      parent_id: newSupplier.tier === 1 ? null : newSupplier.parent_id || null,
    });
    setShowAddModal(false);
    loadSuppliers();
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    const res = await api.uploadSuppliersCsv(csvFile);
    setCsvResult(`Uploaded successfully! Created: ${res.created}, Updated: ${res.updated}`);
    setTimeout(() => {
      setShowCsvModal(false);
      setCsvResult(null);
      loadSuppliers();
    }, 1500);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.material_code.toLowerCase().includes(q) ||
      s.location_label.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Actions Bar */}
      <div className="carbonix-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by supplier name, material, city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E1DFDA] rounded-md focus:outline-none focus:border-[#1B3A2D] bg-[#F7F5F0]/30"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleReseedDemo}
            title="Reseed demo fixtures"
          >
            Reset Demo Data
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => setShowCsvModal(true)}
          >
            Upload CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono-data">
        <div className="flex items-center space-x-2">
          <span className="text-stone-500 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filter Tier:
          </span>
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-2.5 py-1 rounded border ${
              selectedTier === null ? 'bg-[#1B3A2D] text-white border-[#1B3A2D]' : 'bg-white text-stone-700 border-[#E1DFDA]'
            }`}
          >
            All Tiers
          </button>
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-2.5 py-1 rounded border ${
                selectedTier === t ? 'bg-[#1B3A2D] text-white border-[#1B3A2D]' : 'bg-white text-stone-700 border-[#E1DFDA]'
              }`}
            >
              Tier {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-stone-500">Risk Filter:</span>
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRisk(r === 'all' ? null : r)}
              className={`px-2.5 py-1 rounded border capitalize ${
                (r === 'all' && selectedRisk === null) || selectedRisk === r
                  ? 'bg-[#1B3A2D] text-white border-[#1B3A2D]'
                  : 'bg-white text-stone-700 border-[#E1DFDA]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Data Table */}
      <div className="carbonix-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-500 font-mono-data text-xs">
            Loading supplier inventory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#F7F5F0] border-b border-[#E1DFDA] font-mono-data uppercase text-stone-600">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Total Footprint</th>
                  <th className="py-3 px-4">Intensity</th>
                  <th className="py-3 px-4">Carbon Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DFDA]">
                {filteredSuppliers.map((sup) => (
                  <tr
                    key={sup.supplier_id}
                    onClick={() => navigate(`/app/suppliers/${sup.supplier_id}`)}
                    className="hover:bg-[#F7F5F0]/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-data font-bold text-[#1B3A2D]">
                      #{sup.rank || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2C2C2C]">
                      <div>
                        {sup.name}
                        <span className="block text-[10px] font-mono-data text-stone-400">
                          {sup.supplier_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tier={sup.tier} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono-data uppercase text-stone-600 font-medium">
                      {sup.material_code}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {sup.location_label}
                    </td>
                    <td className="py-3 px-4 font-mono-data font-semibold text-[#1B3A2D]">
                      {sup.total_co2e_kg
                        ? `${(sup.total_co2e_kg / 1000).toFixed(2)} tCO₂e`
                        : '0 tCO₂e'}
                    </td>
                    <td className="py-3 px-4 font-mono-data text-stone-700">
                      {sup.intensity_kg_per_unit
                        ? `${sup.intensity_kg_per_unit.toLocaleString()} kg/u`
                        : '0 kg/u'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge risk={sup.carbon_risk || 'medium'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/suppliers/${sup.supplier_id}`);
                        }}
                        className="p-1 rounded text-[#1B3A2D] hover:bg-[#1B3A2D]/10 inline-flex items-center space-x-1"
                      >
                        <span className="font-mono-data text-[11px]">View Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="carbonix-card bg-white p-6 max-w-lg w-full rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDA] mb-4">
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">Add Supplier Activity Data</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-sans"
                    placeholder="e.g. Acme Components"
                  />
                </div>
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Tier *</label>
                  <select
                    value={newSupplier.tier}
                    onChange={(e) => setNewSupplier({ ...newSupplier, tier: Number(e.target.value) as Tier })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                  >
                    <option value={1}>Tier 1 (Direct to Buyer)</option>
                    <option value={2}>Tier 2 (Sub-tier)</option>
                    <option value={3}>Tier 3 (Raw Material Node)</option>
                  </select>
                </div>
              </div>

              {newSupplier.tier > 1 && (
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Parent Supplier ID *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.parent_id || ''}
                    onChange={(e) => setNewSupplier({ ...newSupplier, parent_id: e.target.value })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                    placeholder="e.g. sup_steelco"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Material Category *</label>
                  <select
                    value={newSupplier.material_code}
                    onChange={(e) => setNewSupplier({ ...newSupplier, material_code: e.target.value as MaterialCode })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data capitalize"
                  >
                    {['steel', 'aluminium', 'plastic', 'cement', 'other'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Material Qty (kg)</label>
                  <input
                    type="number"
                    value={newSupplier.material_quantity_kg}
                    onChange={(e) => setNewSupplier({ ...newSupplier, material_quantity_kg: Number(e.target.value) })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Energy Billed (kWh)</label>
                  <input
                    type="number"
                    value={newSupplier.energy_kwh}
                    onChange={(e) => setNewSupplier({ ...newSupplier, energy_kwh: Number(e.target.value) })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                  />
                </div>
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Electricity Grid</label>
                  <select
                    value={newSupplier.electricity_source}
                    onChange={(e) => setNewSupplier({ ...newSupplier, electricity_source: e.target.value as ElectricitySource })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                  >
                    <option value="grid_coal">Grid Coal (0.82)</option>
                    <option value="grid_mixed">Grid Mixed (0.45)</option>
                    <option value="grid_renewable">Grid Renewable (0.04)</option>
                    <option value="onsite_solar">Onsite Solar (0.00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Location City/Country *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.location_label}
                    onChange={(e) => setNewSupplier({ ...newSupplier, location_label: e.target.value })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-sans"
                  />
                </div>
                <div>
                  <label className="block font-mono-data font-semibold text-stone-600 mb-1">Production Volume</label>
                  <input
                    type="number"
                    value={newSupplier.production_volume}
                    onChange={(e) => setNewSupplier({ ...newSupplier, production_volume: Number(e.target.value) })}
                    className="w-full p-2 border border-[#E1DFDA] rounded font-mono-data"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-[#E1DFDA]">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Run Engine & Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="carbonix-card bg-white p-6 max-w-md w-full rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DFDA] mb-4">
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">Upload Supplier CSV Log</h3>
              <button onClick={() => setShowCsvModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadCsv} className="space-y-4">
              <div className="border-2 border-dashed border-[#E1DFDA] hover:border-[#1B3A2D] p-6 rounded-lg text-center bg-[#F7F5F0]/50 transition-colors">
                <Upload className="w-8 h-8 text-[#7A9B8A] mx-auto mb-2" />
                <p className="text-xs font-sans text-stone-600 font-medium">Select CSV file formatted per docs/CSV_FORMAT.md</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-3 text-xs font-mono-data cursor-pointer text-stone-500"
                />
              </div>

              {csvResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-data rounded">
                  {csvResult}
                </div>
              )}

              <div className="flex justify-end space-x-2 border-t border-[#E1DFDA] pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCsvModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={!csvFile}>
                  Upload & Recalculate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
