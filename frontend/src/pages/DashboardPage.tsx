import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Flame,
  ArrowUpRight,
  TrendingDown,
  MapPin,
  Lightbulb,
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ToastAlert } from '../components/ui/ToastAlert';
import { api } from '../services/api';
import type { DashboardData } from '../types';


interface DashboardPageProps {
  period: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  energy: '#1B3A2D',
  material: '#7A9B8A',
  transport: '#D4A843',
  manufacturing: '#C45B4A',
  logistics: '#6B7280',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ period }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const res = await api.getDashboard(period);
      setData(res);
      setLoading(false);
    };
    loadDashboard();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-500 font-mono-data text-sm">
        Loading Carbonix Intelligence Dashboard...
      </div>
    );
  }

  // Convert co2e_kg to tCO2e for display (divide by 1000)
  const totalInTonnes = Math.round((data.total_co2e_kg / 1000) * 10) / 10;

  const categoryChartData = data.by_category.map((cat) => ({
    name: cat.emission_category.toUpperCase(),
    val: Math.round(cat.co2e_kg / 100) / 10, // in tCO2e
    rawKg: cat.co2e_kg,
    categoryKey: cat.emission_category,
  }));

  const tierChartData = data.by_tier.map((t) => ({
    name: `Tier ${t.tier}`,
    val: Math.round(t.co2e_kg / 100) / 10,
    rawKg: t.co2e_kg,
  }));

  return (
    <div className="space-y-6">
      {/* Toast Threshold Alert (Carbonix Plate 10) */}
      <ToastAlert
        type="warning"
        title="Scope 3 Hotspot Threshold Alert"
        message="SteelCo India & AluCo Extrusions exceed 15% of org total footprint. Immediate supplier intervention recommended."
        timestamp="4 MINS AGO AT MUMBAI AUDIT NODE"
      />

      {/* 01. KPI CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard
          title="Total Scope 3 Carbon"
          value={totalInTonnes.toLocaleString()}
          unit="tCO₂e"
          change="-12.3% YoY"
          changeType="positive"
          subtitle="Scope 1-3 current quarter"
          dark
        />
        <KpiCard
          title="Audited Suppliers"
          value={data.supplier_count}
          unit="Nodes"
          change="+4.8% Checked"
          changeType="positive"
          subtitle="Active supply network"
        />
        <KpiCard
          title="Data Coverage"
          value={`${Number(data.data_coverage_pct).toFixed(1)}%`}
          change="Validated"
          changeType="positive"
          subtitle="Primary activity logs"
        />
        <KpiCard
          title="Tier 1 Share"
          value={`${Number(data.tier1_share_pct).toFixed(1)}%`}
          change="Concentrated"
          changeType="negative"
          subtitle="171.9 tCO₂e in Tier 1"
        />
      </div>

      {/* 02. CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Columns) */}
        <div className="carbonix-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">
                Emissions Breakdown by Activity Category
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Five emission buckets measured in metric tonnes CO₂e
              </p>
            </div>
            <span className="font-mono-data text-xs px-2.5 py-1 bg-stone-100 rounded border border-stone-200">
              Formula: Activity × Factor
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Geist Mono' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Geist Mono' }} unit=" t" />
                <Tooltip
                  formatter={(val: any) => [`${val} tCO₂e`, 'Emissions']}
                  contentStyle={{ backgroundColor: '#1B3A2D', color: '#FFF', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.categoryKey] || '#1B3A2D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Distribution Pie (1 Column) */}
        <div className="carbonix-card p-6">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">
              Tier Share Distribution
            </h3>
            <p className="text-xs text-stone-500 font-sans">Emissions split across supply chain depth</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierChartData}
                  dataKey="val"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={35}
                  paddingAngle={4}
                >
                  <Cell fill="#1B3A2D" />
                  <Cell fill="#7A9B8A" />
                  <Cell fill="#D4A843" />
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} tCO₂e`, 'Emissions']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-stone-200">
            {tierChartData.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono-data">
                <span className="flex items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mr-2 ${idx === 0 ? 'bg-[#1B3A2D]' : idx === 1 ? 'bg-[#7A9B8A]' : 'bg-[#D4A843]'}`}></span>
                  {t.name}
                </span>
                <span className="font-semibold">{t.val} tCO₂e</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 03. HOTSPOTS TABLE & RANKINGS SNAPSHOT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Hotspots Table (2 Columns) */}
        <div className="carbonix-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <h3 className="font-heading text-lg font-bold text-[#1B3A2D]">
                Top Carbon Hotspots (Emissions Rank)
              </h3>
            </div>
            <Button
              variant="tertiary"
              size="sm"
              icon={<ArrowUpRight className="w-4 h-4" />}
              onClick={() => navigate('/app/suppliers')}
            >
              View All Suppliers
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#F7F5F0] border-y border-[#E1DFDA] font-mono-data uppercase text-stone-600">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Total Footprint</th>
                  <th className="py-2.5 px-3">Carbon Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DFDA]/60">
                {data.hotspots.map((sup) => (
                  <tr
                    key={sup.supplier_id}
                    onClick={() => navigate(`/app/suppliers/${sup.supplier_id}`)}
                    className="hover:bg-[#F7F5F0]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono-data font-bold text-[#1B3A2D]">#{sup.rank}</td>
                    <td className="py-3 px-3 font-semibold text-[#2C2C2C]">{sup.name}</td>
                    <td className="py-3 px-3 font-mono-data font-medium">
                      {Math.round((sup.total_co2e_kg / 1000) * 100) / 100} tCO₂e
                    </td>
                    <td className="py-3 px-3">
                      <Badge risk={sup.carbon_risk} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[#1B3A2D] font-mono-data hover:underline">Detail →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Intensity Ranking Snapshot & Teasers (1 Column) */}
        <div className="space-y-6">
          {/* Intensity Leaders */}
          <div className="carbonix-card p-6">
            <h3 className="font-heading text-base font-bold text-[#1B3A2D] mb-3 flex items-center justify-between">
              <span>Highest Carbon Intensity</span>
              <span className="text-[10px] font-mono-data font-normal text-stone-500">kg CO₂e / unit</span>
            </h3>
            <div className="space-y-2.5">
              {data.ranking_snapshot.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-[#F7F5F0] rounded border border-[#E1DFDA] text-xs">
                  <div>
                    <p className="font-semibold text-stone-800">{item.name}</p>
                    <Badge risk={item.carbon_risk} size="sm" className="mt-1" />
                  </div>
                  <span className="font-mono-data font-bold text-[#1B3A2D]">
                    {item.intensity_kg_per_unit.toLocaleString()} kg/u
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Decarbonization Recs Teaser */}
          <div className="carbonix-card-dark p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-[#7A9B8A]" />
                <h4 className="font-heading font-bold text-sm">Top Actionable Recs</h4>
              </div>
              <button
                onClick={() => navigate('/app/recommendations')}
                className="text-xs font-mono-data text-[#7A9B8A] hover:underline"
              >
                View Inbox →
              </button>
            </div>
            <div className="space-y-2">
              {data.top_recommendations.map((rec) => (
                <div key={rec.recommendation_id} className="p-2.5 rounded bg-[#12281F] border border-[#254F3E] text-xs">
                  <p className="font-medium text-stone-200">{rec.title}</p>
                  <p className="text-[11px] font-mono-data text-emerald-400 mt-1">
                    Potential Cut: -{(rec.delta_co2e_kg / 1000).toFixed(1)} tCO₂e
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 04. MAP & SCENARIO QUICK TEASERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="carbonix-card p-6 flex items-center justify-between bg-gradient-to-r from-white to-[#EEF7F2]">
          <div>
            <span className="font-mono-data text-xs text-[#7A9B8A] uppercase font-bold">Geographic Baselayer</span>
            <h4 className="font-heading text-lg font-bold text-[#1B3A2D] mt-1">
              Explore Hotspots on Interactive Map
            </h4>
            <p className="text-xs text-stone-600 mt-1">Pinpoint topological route efficiency & regulatory thresholds.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<MapPin className="w-4 h-4" />}
            onClick={() => navigate('/app/map')}
          >
            Open Map View
          </Button>
        </div>

        <div className="carbonix-card p-6 flex items-center justify-between bg-gradient-to-r from-white to-[#FDF9EE]">
          <div>
            <span className="font-mono-data text-xs text-amber-700 uppercase font-bold">What-If Decarbonization</span>
            <h4 className="font-heading text-lg font-bold text-[#1B3A2D] mt-1">
              Simulate Net-Zero Scenarios
            </h4>
            <p className="text-xs text-stone-600 mt-1">Adjust recycled content, renewable grid, and freight mode sliders.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<TrendingDown className="w-4 h-4" />}
            onClick={() => navigate('/app/scenarios')}
          >
            Open Simulator
          </Button>
        </div>
      </div>
    </div>
  );
};
