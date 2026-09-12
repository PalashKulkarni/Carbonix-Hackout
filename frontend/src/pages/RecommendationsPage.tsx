import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import type { Recommendation, RecommendationStatus } from '../types';


interface RecommendationsPageProps {
  period: string;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadRecommendations = async () => {
    setLoading(true);
    const res = await api.getRecommendations(period);
    setRecs(res.items);
    setLoading(false);
  };

  useEffect(() => {
    loadRecommendations();
  }, [period]);

  const handleStatusChange = async (recId: string, status: RecommendationStatus) => {
    await api.updateRecommendationStatus(recId, status);
    setRecs((prev) =>
      prev.map((r) => (r.recommendation_id === recId ? { ...r, status } : r))
    );
  };

  const filteredRecs = recs.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const totalPotentialReductionKg = recs.reduce((acc, r) => acc + r.delta_co2e_kg, 0);

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="carbonix-card p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              Decarbonization Actions Inbox
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Machine-proposed circular interventions ranked by maximum carbon reduction impact (ΔCO₂e).
          </p>
        </div>

        <div className="bg-[#1B3A2D] text-[#F7F5F0] p-4 rounded-lg border border-[#254F3E] text-right">
          <span className="font-mono-data text-[10px] text-[#7A9B8A] uppercase font-semibold block">Total Reduction Potential</span>
          <span className="font-heading text-2xl font-bold">
            -{(totalPotentialReductionKg / 1000).toFixed(1)}
          </span>
          <span className="font-mono-data text-xs text-[#7A9B8A] ml-1">tCO₂e</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs font-mono-data">
        <span className="text-stone-500">Filter Status:</span>
        {['all', 'open', 'in_progress', 'accepted', 'dismissed'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded border capitalize ${
              filterStatus === st
                ? 'bg-[#1B3A2D] text-white border-[#1B3A2D]'
                : 'bg-white text-stone-700 border-[#E1DFDA]'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Action Cards List */}
      {loading ? (
        <div className="p-8 text-center text-stone-500 font-mono-data text-xs">
          Scanning recommendation catalog...
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="carbonix-card p-8 text-center text-stone-500 text-xs font-mono-data">
          No recommendations found matching status filter "{filterStatus}".
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => (
            <div key={rec.recommendation_id} className="carbonix-card p-6 bg-white hover:border-[#1B3A2D] transition-all">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#E1DFDA]">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-data text-[10px] uppercase font-bold bg-[#1B3A2D]/10 text-[#1B3A2D] px-2 py-0.5 rounded border border-[#1B3A2D]/20">
                      {rec.action_type}
                    </span>
                    <button
                      onClick={() => navigate(`/app/suppliers/${rec.supplier_id}`)}
                      className="font-mono-data text-xs text-stone-500 hover:underline font-semibold"
                    >
                      Supplier: {rec.supplier_name || rec.supplier_id} →
                    </button>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-[#1B3A2D] mt-2">
                    {rec.title}
                  </h3>
                </div>

                <div className="text-right bg-[#EEF7F2] p-3 rounded border border-emerald-200">
                  <span className="font-mono-data text-[10px] text-emerald-800 uppercase font-bold block">Engine Delta</span>
                  <span className="font-heading text-xl font-bold text-emerald-700">
                    -{(rec.delta_co2e_kg / 1000).toFixed(1)} tCO₂e
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 font-sans my-3 leading-relaxed">
                {rec.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#E1DFDA]/60 text-xs">
                <div className="flex items-center space-x-2 font-mono-data text-stone-500">
                  <span>Current: {(rec.current_co2e_kg / 1000).toFixed(1)}t</span>
                  <span>→</span>
                  <span className="font-bold text-[#1B3A2D]">Projected: {(rec.projected_co2e_kg / 1000).toFixed(1)}t</span>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center space-x-2 font-mono-data">
                  <span className="text-stone-400">Set Status:</span>
                  <button
                    onClick={() => handleStatusChange(rec.recommendation_id, 'open')}
                    className={`px-2.5 py-1 rounded text-[11px] border ${
                      rec.status === 'open' ? 'bg-[#1B3A2D] text-white border-[#1B3A2D]' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleStatusChange(rec.recommendation_id, 'in_progress')}
                    className={`px-2.5 py-1 rounded text-[11px] border ${
                      rec.status === 'in_progress' ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange(rec.recommendation_id, 'accepted')}
                    className={`px-2.5 py-1 rounded text-[11px] border ${
                      rec.status === 'accepted' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => handleStatusChange(rec.recommendation_id, 'dismissed')}
                    className={`px-2.5 py-1 rounded text-[11px] border ${
                      rec.status === 'dismissed' ? 'bg-rose-600 text-white border-rose-600' : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    Dismissed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
