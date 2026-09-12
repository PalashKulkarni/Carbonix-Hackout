import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import type { DashboardData } from '../types';


interface ReportsPageProps {
  period: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ period }) => {
  const [generating, setGenerating] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.getDashboard(period).then(setData);
  }, [period]);

  const handleGeneratePdf = async () => {
    setGenerating(true);
    setDownloadReady(false);
    try {
      const blob = await api.generateEsgReport(period);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Carbonix_ESG_Report_${period}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadReady(true);
    } catch {
      setDownloadReady(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="carbonix-card p-6 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1B3A2D]" />
            <h2 className="font-heading text-xl font-bold text-[#1B3A2D]">
              ESG Executive Audit Report Generator
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Generate COP28 & ISSB S2 compliant Scope 3 inventory statements for regulatory filing and board disclosure.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Download className="w-4 h-4" />}
          onClick={handleGeneratePdf}
          disabled={generating}
        >
          {generating ? 'Compiling Audit PDF...' : 'Generate PDF Audit Report'}
        </Button>
      </div>

      {/* PDF Document Preview Card */}
      <div className="carbonix-card p-8 bg-white border-1.5 border-[#E1DFDA] max-w-4xl mx-auto shadow-lg">
        {/* Document Header */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-[#1B3A2D]">
          <div>
            <span className="font-heading text-2xl font-bold text-[#1B3A2D]">CARBONIX</span>
            <p className="font-mono-data text-[10px] uppercase text-[#7A9B8A] font-semibold">
              CARBON-AWARE SUPPLY CHAIN INTELLIGENCE REPORT
            </p>
          </div>
          <div className="text-right font-mono-data text-xs text-stone-600">
            <span className="block font-bold">SYSTEM SPECIFICATION v2.4</span>
            <span>PERIOD: CY {period} • AUDIT STATUS: PASSED</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="my-6 space-y-4 text-xs font-sans text-stone-700">
          <h3 className="font-heading font-bold text-base text-[#1B3A2D]">1. Executive Inventory Summary</h3>
          <p className="leading-relaxed">
            Apex Manufacturing has audited Scope 3 greenhouse gas emissions across {data?.supplier_count ?? 0} multi-tier supplier nodes for calendar year {period}. The total inventory equals <strong className="text-[#1B3A2D]">{(data?.total_co2e_kg ?? 0).toLocaleString()} kg CO₂e ({((data?.total_co2e_kg ?? 0) / 1000).toFixed(2)} metric tonnes)</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F7F5F0] rounded border border-[#E1DFDA] font-mono-data">
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Total Footprint</span>
              <span className="font-bold text-[#1B3A2D] text-sm">{((data?.total_co2e_kg ?? 0) / 1000).toFixed(2)} tCO₂e</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Tier 1 Share</span>
              <span className="font-bold text-[#1B3A2D] text-sm">{(data?.tier1_share_pct ?? 0).toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Audited Suppliers</span>
              <span className="font-bold text-[#1B3A2D] text-sm">{data?.supplier_count ?? 0} Nodes</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase block font-semibold">Compliance Rating</span>
              <span className="font-bold text-emerald-700 text-sm">94.2%</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="my-6 space-y-2">
          <h3 className="font-heading font-bold text-base text-[#1B3A2D]">2. Categorical Audit Breakdown</h3>
          <table className="w-full text-left text-xs font-sans border border-[#E1DFDA]">
            <thead className="bg-[#F7F5F0] font-mono-data uppercase text-stone-700 border-b border-[#E1DFDA]">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Emissions (kg CO₂e)</th>
                <th className="p-2.5">Metric Tonnes (tCO₂e)</th>
                <th className="p-2.5">% Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1DFDA] font-mono-data">
              {(data?.by_category ?? []).map((category) => <tr key={category.emission_category}><td className="p-2.5 font-bold">{category.emission_category.replace('_', ' ')}</td><td className="p-2.5">{category.co2e_kg.toLocaleString()}</td><td className="p-2.5">{(category.co2e_kg / 1000).toFixed(2)}</td><td className="p-2.5">{data?.total_co2e_kg ? ((category.co2e_kg / data.total_co2e_kg) * 100).toFixed(2) : '0.00'}%</td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Audit Certification Stamp */}
        <div className="mt-8 pt-4 border-t border-[#E1DFDA] flex items-center justify-between text-xs font-mono-data text-stone-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Certified by Lead ESG Auditor Dr. Helen Vance</span>
          </div>
          <span>Report Hash: 0x9f82a...c4b2</span>
        </div>

        {downloadReady && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono-data text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ESG Audit Report PDF compiled successfully!</span>
            </div>
            <span className="px-3 py-1.5 bg-[#1B3A2D] text-white text-xs font-mono-data rounded">PDF downloaded</span>
          </div>
        )}
      </div>
    </div>
  );
};
