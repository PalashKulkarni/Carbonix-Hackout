import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  dark?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  change,
  changeType = 'neutral',
  subtitle,
  icon,
  dark = false,
}) => {
  const changeColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200', // positive reduction or improvement
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    neutral: 'text-stone-600 bg-stone-100 border-stone-200',
  };

  return (
    <div className={`p-5 rounded-lg border transition-all ${
      dark 
        ? 'bg-[#1B3A2D] text-[#F7F5F0] border-[#254F3E]' 
        : 'bg-white text-[#2C2C2C] border-[#E1DFDA] shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-mono-data text-xs font-semibold tracking-wider uppercase truncate pr-2 ${
          dark ? 'text-[#7A9B8A]' : 'text-stone-500'
        }`} title={title}>
          {title}
        </span>
        {icon && <span className={dark ? 'text-[#7A9B8A]' : 'text-stone-400'}>{icon}</span>}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className="font-heading text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className={`font-mono-data text-sm font-medium ${dark ? 'text-stone-300' : 'text-stone-500'}`}>
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-[#E1DFDA]/60">
        {change && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono-data font-medium border ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
        {subtitle && (
          <span className={`text-xs font-sans ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
