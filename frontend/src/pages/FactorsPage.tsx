import React, { useEffect, useState } from 'react';
import { Database, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { EmissionFactor, FactorCategory } from '../types';


export const FactorsPage: React.FC = () => {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FactorCategory>('material');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ factor_kg_co2e_per_unit: number; source: string; year: number }>({
    factor_kg_co2e_per_unit: 0,
    source: '',
    year: 2024,
  });

  const loadFactors = async () => {
    setLoading(true);
    const res = await api.getFactors();
    setFactors(res.items);
    setLoading(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleStartEdit = (factor: EmissionFactor) => {
    setEditingId(factor.factor_id);
    setEditForm({
      factor_kg_co2e_per_unit: factor.factor_kg_co2e_per_unit,
      source: factor.source,
      year: factor.year,
    });
  };

  const handleSaveFactor = async (factorId: string) => {
    await api.updateFactor(factorId, editForm);
    setFactors((prev) =>
      prev.map((f) => (f.factor_id === factorId ? { ...f, ...editForm } : f))
    );
    setEditingId(null);
  };

  const categories: FactorCategory[] = ['material', 'energy', 'transport', 'manufacturing', 'logistics'];

  const filteredFactors = factors.filter((f) => f.factor_category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="carbonix-card p-6 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#1B3A2D]" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              Emission Factor Database (Global Registry)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Auditable emission intensity conversion factors. Editing any factor automatically recalculates organization emissions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={loadFactors}
        >
          Reload Registry
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E1DFDA] pb-2 font-mono-data text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-t font-semibold uppercase transition-all ${
              activeCategory === cat
                ? 'bg-[#1B3A2D] text-white border-t-2 border-[#7A9B8A]'
                : 'bg-white text-stone-600 border border-[#E1DFDA] hover:bg-[#F7F5F0]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Factors Table */}
      <div className="carbonix-card overflow-hidden bg-white">
        {loading ? (
          <div className="p-8 text-center text-stone-500 font-mono-data text-xs">
            Querying factor database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#F7F5F0] border-b border-[#E1DFDA] font-mono-data uppercase text-stone-600">
                <tr>
                  <th className="py-3 px-4">Factor Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Factor Value (kg CO₂e/unit)</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Source Standard</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DFDA]">
                {filteredFactors.map((f) => {
                  const isEditing = editingId === f.factor_id;

                  return (
                    <tr key={f.factor_id} className="hover:bg-[#F7F5F0]/60">
                      <td className="py-3 px-4 font-mono-data font-bold text-[#1B3A2D]">
                        {f.code}
                      </td>
                      <td className="py-3 px-4 font-mono-data uppercase text-stone-500">
                        {f.factor_category}
                      </td>
                      <td className="py-3 px-4 font-mono-data font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editForm.factor_kg_co2e_per_unit}
                            onChange={(e) =>
                              setEditForm({ ...editForm, factor_kg_co2e_per_unit: Number(e.target.value) })
                            }
                            className="w-28 p-1 border border-[#1B3A2D] rounded text-xs"
                          />
                        ) : (
                          <span className="text-[#1B3A2D]">{f.factor_kg_co2e_per_unit}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-data text-stone-600">{f.unit}</td>
                      <td className="py-3 px-4 text-stone-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.source}
                            onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                            className="w-36 p-1 border border-[#1B3A2D] rounded text-xs"
                          />
                        ) : (
                          f.source
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-data text-stone-600">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.year}
                            onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                            className="w-20 p-1 border border-[#1B3A2D] rounded text-xs"
                          />
                        ) : (
                          f.year
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveFactor(f.factor_id)}
                              className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(f)}
                            className="p-1.5 text-[#1B3A2D] hover:bg-[#1B3A2D]/10 rounded flex items-center space-x-1 ml-auto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="font-mono-data text-[11px]">Edit Factor</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
