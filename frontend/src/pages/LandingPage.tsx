import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, ShieldCheck, BarChart3, FolderTree, Sliders, Database, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#2C2C2C] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-[#E1DFDA] bg-white px-8 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B3A2D] text-[#7A9B8A] flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold tracking-tight text-[#1B3A2D]">
              Carbonix
            </span>
            <span className="ml-2 font-mono-data text-[10px] uppercase tracking-wider text-[#7A9B8A] bg-[#1B3A2D]/10 px-2 py-0.5 rounded">
              v2.4 Climate Portal
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-stone-600 hover:text-[#1B3A2D]"
          >
            Sign In
          </button>
          <Button variant="primary" size="md" onClick={() => navigate('/login')}>
            Launch App Shell
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-8 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B3A2D]/10 border border-[#1B3A2D]/20 text-[#1B3A2D] text-xs font-mono-data font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#7A9B8A]" />
          <span>Research-Grade Scope 3 Intelligence System</span>
        </div>

        <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-[#1B3A2D] max-w-4xl leading-tight">
          Carbon-Aware Supply Chain Intelligence & Decarbonization
        </h1>

        <p className="mt-6 text-lg text-stone-600 max-w-2xl font-sans leading-relaxed">
          Auditable Scope 3 carbon accounting across multi-tier supply networks. Ingest activity, calculate exact CO₂e footprints, identify hotspots, and model what-if circular scenarios.
        </p>

        <div className="mt-8 flex items-center justify-center space-x-4">
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/login')}
          >
            Access Platform Demo
          </Button>
        </div>

        {/* Executive Stats Card Banner */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 w-full text-left">
          <div className="carbonix-card p-6">
            <span className="font-mono-data text-xs text-stone-500 uppercase font-semibold">Total Audited Carbon</span>
            <p className="font-heading text-3xl font-bold text-[#1B3A2D] mt-2">285.4 tCO₂e</p>
            <p className="text-xs text-emerald-700 mt-1 font-mono-data">-12.3% YoY baseline</p>
          </div>

          <div className="carbonix-card p-6">
            <span className="font-mono-data text-xs text-stone-500 uppercase font-semibold">Audited Suppliers</span>
            <p className="font-heading text-3xl font-bold text-[#1B3A2D] mt-2">1,247</p>
            <p className="text-xs text-stone-500 mt-1 font-sans">Multi-tier coverage</p>
          </div>

          <div className="carbonix-card p-6">
            <span className="font-mono-data text-xs text-stone-500 uppercase font-semibold">Compliance Rate</span>
            <p className="font-heading text-3xl font-bold text-[#1B3A2D] mt-2">94.2%</p>
            <p className="text-xs text-emerald-700 mt-1 font-mono-data">+2.4% validated</p>
          </div>

          <div className="carbonix-card p-6">
            <span className="font-mono-data text-xs text-stone-500 uppercase font-semibold">Risk Index</span>
            <p className="font-heading text-3xl font-bold text-[#1B3A2D] mt-2">73 / 100</p>
            <p className="text-xs text-amber-700 mt-1 font-mono-data">Borderline threshold</p>
          </div>
        </div>
      </section>

      {/* Workflow Grid */}
      <section className="bg-white py-16 px-8 border-t border-[#E1DFDA]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-[#1B3A2D]">
              End-to-End Climate Telemetry & Action Architecture
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              From raw activity ingest to machine-assisted supplier decarbonization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-[#F7F5F0] border border-[#E1DFDA]">
              <div className="w-10 h-10 rounded-md bg-[#1B3A2D] text-[#7A9B8A] flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">1. Ingest Data</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Import primary supplier CSV activity logs, manual forms, or gap-fill activity data via Model A.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#F7F5F0] border border-[#E1DFDA]">
              <div className="w-10 h-10 rounded-md bg-[#1B3A2D] text-[#7A9B8A] flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">2. Calculate Footprint</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Deterministic factor engine evaluates 5 emission categories: energy, transport, material, mfg, logistics.
              </p>
            </div>

            <div className="p-6 rounded-lg bg-[#F7F5F0] border border-[#E1DFDA]">
              <div className="w-10 h-10 rounded-md bg-[#1B3A2D] text-[#7A9B8A] flex items-center justify-center mb-4">
                <FolderTree className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">3. Map Hotspots</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Visualize multi-tier supplier trees and geographic pins to isolate high-carbon risk nodes.
              </p>
            </div>


            <div className="p-6 rounded-lg bg-[#F7F5F0] border border-[#E1DFDA]">
              <div className="w-10 h-10 rounded-md bg-[#1B3A2D] text-[#7A9B8A] flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#1B3A2D]">4. Simulate Actions</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Model circular alternatives, renewable energy switches, and modal transport shifts with live What-If sliders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-8 border-t border-[#E1DFDA] bg-[#1B3A2D] text-[#7A9B8A] text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#7A9B8A]" />
            <span>© Carbonix Intel Platform 2025. Strictly compliant with COP28 directives.</span>
          </div>
          <div className="mt-4 md:mt-0 font-mono-data">
            SYSTEM SPECIFICATION v2.4
          </div>
        </div>
      </footer>
    </div>
  );
};
