import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ChatOverlay } from './ChatOverlay';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  period: string;
  onPeriodChange: (period: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  subtitle,
  period,
  onPeriodChange,
  onRefresh,
  loading,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F0]">
      {/* Persistent Carbonix Deep Forest Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          period={period}
          onPeriodChange={onPeriodChange}
          onToggleChat={() => setChatOpen(!chatOpen)}
          chatOpen={chatOpen}
          onRefresh={onRefresh}
          loading={loading}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Auditor Chat Drawer */}
      <ChatOverlay
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        period={period}
      />
    </div>
  );
};
