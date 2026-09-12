import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, TrendingDown, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import type { ScenarioSimulationResponse } from '../types';


interface ScenariosPageProps {
  period: string;
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ period }) => {
  const [recycledPct, setRecycledPct] = useState(40);
  const [renewablePct, setRenewablePct] = useState(60);
  const [railPct, setRailPct] = useState(50);

  const [result, setResult] = useState<ScenarioSimulationResponse | null>(null);

  const runSimulation = async (rec: number, ren: number, rail: number) => {
    const res = await api.simulateScenario({
      period,
      recycled_material_pct: rec,
      renewable_energy_pct: ren,
      rail_transport_pct: rail,
    });
    setResult(res);
  };


  useEffect(() => {
    runSimulation(recycledPct, renewablePct, railPct);
  }, [period]);

  const handleSliderChange = (type: 'rec' | 'ren' | 'rail', value: number) => {
    let nextRec = recycledPct;
    let nextRen = renewablePct;
    let nextRail = railPct;

    if (type === 'rec') {
      nextRec = value;
      setRecycledPct(value);
    } else if (type === 'ren') {
      nextRen = value;
      setRenewablePct(value);
    } else {
      nextRail = value;
      setRailPct(value);
    }

    runSimulation(nextRec, nextRen, nextRail);
  };

  const handleReset = () => {
    setRecycledPct(0);
    setRenewablePct(0);
    setRailPct(0);
    runSimulation(0, 0, 0);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div
        className="rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #1A3D2E 0%, #254F3E 100%)', border: '1px solid #2D6A4F' }}
      >
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5" style={{ color: '#8FB3A0' }} />
            <h2 className="font-heading text-xl font-bold text-white">
              What-If Decarbonization Scenario Simulator
            </h2>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Simulate corporate procurement shifts across raw materials, grid electrification, and freight modal choices.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sliders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Control Panel (2 Columns) */}
        <div className="lg:col-span-2 p-6 space-y-6 rounded-xl" style={{ background: '#163325', border: '1px solid #1E4535' }}>
          <h3 className="font-heading text-base font-bold pb-3 border-b" style={{ color: '#8FB3A0', borderColor: '#1E4535' }}>
            Procurement Shift Parameters (0% – 100%)
          </h3>

          {/* Slider 1: Recycled Material */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-data">
              <span className="font-bold uppercase" style={{ color: '#8FB3A0' }}>1. Recycled Material Content</span>
              <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(143,179,160,0.15)', color: '#6EE7B7' }}>
                {recycledPct}% Shifted
              </span>
            </div>
            <input type="range" min="0" max="100" value={recycledPct}
              onChange={(e) => handleSliderChange('rec', Number(e.target.value))}
              className="w-full cursor-pointer" style={{ accentColor: '#6EE7B7' }} />
            <p className="text-[11px] font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Blend virgin steel, aluminium, and plastic procurement towards certified recycled feedstock factors.
            </p>
          </div>

          {/* Slider 2: Renewable Energy */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#1E4535' }}>
            <div className="flex items-center justify-between text-xs font-mono-data">
              <span className="font-bold uppercase" style={{ color: '#8FB3A0' }}>2. Supplier Renewable Energy PPA</span>
              <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(143,179,160,0.15)', color: '#6EE7B7' }}>
                {renewablePct}% Shifted
              </span>
            </div>
            <input type="range" min="0" max="100" value={renewablePct}
              onChange={(e) => handleSliderChange('ren', Number(e.target.value))}
              className="w-full cursor-pointer" style={{ accentColor: '#6EE7B7' }} />
            <p className="text-[11px] font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Transition supplier electricity consumption off coal grids towards solar and renewable PPAs.
            </p>
          </div>

          {/* Slider 3: Rail Transport */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: '#1E4535' }}>
            <div className="flex items-center justify-between text-xs font-mono-data">
              <span className="font-bold uppercase" style={{ color: '#8FB3A0' }}>3. Rail &amp; Sea Modal Transport Shift</span>
              <span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(143,179,160,0.15)', color: '#6EE7B7' }}>
                {railPct}% Shifted
              </span>
            </div>
            <input type="range" min="0" max="100" value={railPct}
              onChange={(e) => handleSliderChange('rail', Number(e.target.value))}
              className="w-full cursor-pointer" style={{ accentColor: '#6EE7B7' }} />
            <p className="text-[11px] font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Shift inbound air and road freight tonne-km to low-carbon rail and sea freight routes.
            </p>
          </div>
        </div>

        {/* Live Simulation Projection Card (1 Column) */}
        <div className="carbonix-card-dark p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[#254F3E] mb-4">
              <TrendingDown className="w-5 h-5 text-[#7A9B8A]" />
              <h3 className="font-heading font-bold text-lg text-white">Live Carbon Math Delta</h3>
            </div>

            {result ? (
              <div className="space-y-4">
                <div>
                  <span className="font-mono-data text-[10px] text-[#7A9B8A] uppercase font-bold block">Current Baseline Total</span>
                  <span className="font-heading text-2xl font-bold">
                    {(result.current_total_co2e_kg / 1000).toFixed(1)} tCO₂e
                  </span>
                </div>

                <div className="p-4 bg-[#12281F] rounded-lg border border-[#254F3E]">
                  <span className="font-mono-data text-[10px] text-emerald-400 uppercase font-bold block">Projected Total Emissions</span>
                  <span className="font-heading text-3xl font-bold text-white">
                    {(result.projected_total_co2e_kg / 1000).toFixed(1)}
                  </span>
                  <span className="font-mono-data text-xs text-[#7A9B8A] ml-1">tCO₂e</span>
                </div>

                <div className="p-4 bg-emerald-950/60 rounded-lg border border-emerald-800/80">
                  <span className="font-mono-data text-[10px] text-emerald-300 uppercase font-bold block">Achievable Net Reduction</span>
                  <span className="font-heading text-3xl font-bold text-emerald-400">
                    -{(result.delta_co2e_kg / 1000).toFixed(1)} tCO₂e
                  </span>
                  <p className="font-mono-data text-xs text-emerald-300 mt-1">
                    ({result.delta_pct}% Total Scope 3 Reduction)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#7A9B8A] italic">Calculating delta math...</p>
            )}
          </div>

          <div className="pt-4 border-t border-[#254F3E] text-[11px] font-mono-data text-[#7A9B8A]">
            Official CO₂e formula evaluated in real-time by python engine.
          </div>
        </div>
      </div>
    </div>
  );
};
