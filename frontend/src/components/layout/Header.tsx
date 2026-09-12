import React from 'react';
import { Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  period: string;
  onPeriodChange: (period: string) => void;
  onToggleChat: () => void;
  chatOpen?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  period,
  onPeriodChange,
  onToggleChat,
  chatOpen,
  onRefresh,
  loading,
}) => {
  return (
    <header className="bg-white border-b border-[#E1DFDA] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="font-heading text-2xl font-bold text-[#2C2C2C] tracking-tight">
            {title}
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono-data bg-[#1B3A2D]/10 text-[#1B3A2D] font-semibold border border-[#1B3A2D]/20">
            Apex Manufacturing
          </span>
        </div>
        {subtitle && (
          <p className="text-xs font-sans text-stone-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Period Selector */}
        <div className="flex items-center bg-[#F7F5F0] border border-[#E1DFDA] rounded-md px-3 py-1.5 text-xs font-mono-data">
          <Calendar className="w-3.5 h-3.5 mr-2 text-stone-500" />
          <span className="text-stone-500 mr-2">Reporting Period:</span>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-transparent font-semibold text-[#1B3A2D] focus:outline-none cursor-pointer"
          >
            <option value="2025">CY 2025</option>
            <option value="2024">CY 2024</option>
            <option value="last_12m">Last 12 Months</option>
          </select>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh emissions math"
            className="p-2 rounded-md border border-[#E1DFDA] hover:bg-[#F7F5F0] text-stone-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7A9B8A]' : ''}`} />
          </button>
        )}

        {/* Chat Overlay Toggle */}
        <Button
          variant={chatOpen ? 'primary' : 'secondary'}
          size="sm"
          icon={<MessageSquare className="w-4 h-4" />}
          onClick={onToggleChat}
        >
          AI Auditor Chat
        </Button>
      </div>
    </header>
  );
};
