import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { SuppliersListPage } from './pages/SuppliersListPage';
import { SupplierDetailPage } from './pages/SupplierDetailPage';
import { HierarchyPage } from './pages/HierarchyPage';
import { MapPage } from './pages/MapPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { FactorsPage } from './pages/FactorsPage';
import { ReportsPage } from './pages/ReportsPage';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/app': { title: 'Executive Carbon Dashboard', subtitle: 'Scope 1-3 greenhouse gas inventory & supply network hotspots' },
  '/app/suppliers': { title: 'Supplier Directory & Ingest', subtitle: 'Ingest activity data, manage tiers, and upload CSV logs' },
  '/app/hierarchy': { title: 'Supply Chain Hierarchy Tree', subtitle: 'Multi-tier dependency tree mapping Org -> Tier 1 -> Tier 2 -> Tier 3' },
  '/app/map': { title: 'Geographic Hotspot Map', subtitle: 'Topological route efficiency & carbon risk node mapping' },
  '/app/recommendations': { title: 'Decarbonization Actions Inbox', subtitle: 'Machine-ranked circular material, energy, and freight actions' },
  '/app/scenarios': { title: 'What-If Decarbonization Simulator', subtitle: 'Live parameter sliders for procurement shift modeling' },
  '/app/factors': { title: 'Emission Factor Registry', subtitle: 'Auditable factor conversion database for CO₂e calculations' },
  '/app/reports': { title: 'ESG Audit Report Generator', subtitle: 'COP28 compliant regulatory audit statements and PDF export' },
};

const AppRoutes: React.FC = () => {
  const [period, setPeriod] = useState('2025');
  const location = useLocation();

  let currentPageInfo: { title: string; subtitle?: string } = {
    title: 'Carbonix System Portal',
    subtitle: 'Research-Grade Climate Platform',
  };


  if (location.pathname.startsWith('/app/suppliers/')) {
    currentPageInfo = { title: 'Supplier Detailed Telemetry', subtitle: 'Activity logs, category breakdown, and specific recs' };
  } else if (PAGE_TITLES[location.pathname]) {
    currentPageInfo = PAGE_TITLES[location.pathname];
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* App Shell Routes */}
      <Route
        path="/app"
        element={
          <AppLayout
            title={currentPageInfo.title}
            subtitle={currentPageInfo.subtitle}
            period={period}
            onPeriodChange={setPeriod}
          />
        }
      >
        <Route index element={<DashboardPage period={period} />} />
        <Route path="suppliers" element={<SuppliersListPage period={period} />} />
        <Route path="suppliers/:supplier_id" element={<SupplierDetailPage />} />
        <Route path="hierarchy" element={<HierarchyPage period={period} />} />
        <Route path="map" element={<MapPage period={period} />} />
        <Route path="recommendations" element={<RecommendationsPage period={period} />} />
        <Route path="scenarios" element={<ScenariosPage period={period} />} />
        <Route path="factors" element={<FactorsPage />} />
        <Route path="reports" element={<ReportsPage period={period} />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};
