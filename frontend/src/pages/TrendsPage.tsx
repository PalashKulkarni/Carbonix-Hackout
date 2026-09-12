import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface TrendsPageProps {
  period: string;
}

const HISTORICAL_DATA = [
  { quarter: 'Q1 2023', total: 340.5, energy: 95.0, material: 220.0, transport: 15.5 },
  { quarter: 'Q2 2023', total: 325.2, energy: 88.0, material: 212.0, transport: 14.2 },
  { quarter: 'Q3 2023', total: 310.8, energy: 82.0, material: 205.0, transport: 13.8 },
  { quarter: 'Q4 2023', total: 298.4, energy: 78.0, material: 198.0, transport: 12.4 },
  { quarter: 'Q1 2024', total: 292.1, energy: 76.0, material: 194.0, transport: 12.1 },
  { quarter: 'Q2 2024', total: 288.6, energy: 75.0, material: 192.0, transport: 11.6 },
  { quarter: 'Q3 2024', total: 286.2, energy: 74.0, material: 190.5, font: 11.7 },
  { quarter: 'Q4 2024', total: 285.4, energy: 73.5, material: 199.1, transport: 8.7 },
];

export const TrendsPage: React.FC<TrendsPageProps> = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="carbonix-card p-6 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#1B3A2D]" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              Historical Carbon Emissions Trends (2023 – 2024)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Quarterly trajectory analysis across total Scope 3 footprint, energy grid decarbonization, and material substitution.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono-data bg-[#F7F5F0] px-3 py-1.5 rounded border border-[#E1DFDA]">
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>Quarterly Rollup</span>
        </div>
      </div>

      {/* Main Historical Chart */}
      <div className="carbonix-card p-6 bg-white">
        <h3 className="font-heading text-base font-bold text-[#1B3A2D] mb-4">
          Historical Scope 3 Footprint Trajectory (tCO₂e)
        </h3>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HISTORICAL_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B3A2D" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#1B3A2D" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorMat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A9B8A" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7A9B8A" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fontFamily: 'Geist Mono' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Geist Mono' }} unit=" t" />
              <Tooltip formatter={(val: any) => [`${val} tCO₂e`, 'Emissions']} />
              <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Geist Mono' }} />
              <Area type="monotone" dataKey="total" stroke="#1B3A2D" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Footprint" />
              <Area type="monotone" dataKey="material" stroke="#7A9B8A" strokeWidth={2} fillOpacity={1} fill="url(#colorMat)" name="Embodied Material" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
