import React from 'react';
import type { CarbonRisk, DataSource, Tier } from '../../types';


interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'compliant' | 'at-risk' | 'critical' | 'pending' | 'tier' | 'data-source';
  risk?: CarbonRisk;
  tier?: Tier;
  dataSource?: DataSource;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  risk,
  tier,
  dataSource,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (risk) {
    if (risk === 'low') {
      return (
        <span className={`inline-flex items-center font-mono-data font-medium rounded-md badge-compliant ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
          Compliant (Low)
        </span>
      );
    }
    if (risk === 'medium') {
      return (
        <span className={`inline-flex items-center font-mono-data font-medium rounded-md badge-at-risk ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          At Risk (Medium)
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center font-mono-data font-medium rounded-md badge-critical ${sizeClasses} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
        High Risk (Critical)
      </span>
    );
  }

  if (tier) {
    const tierColors = {
      1: 'bg-[#1B3A2D]/10 text-[#1B3A2D] border border-[#1B3A2D]/30',
      2: 'bg-[#7A9B8A]/20 text-[#1B3A2D] border border-[#7A9B8A]/40',
      3: 'bg-stone-200/80 text-stone-700 border border-stone-300',
    };
    return (
      <span className={`inline-flex items-center font-mono-data font-medium rounded ${sizeClasses} ${tierColors[tier]} ${className}`}>
        Tier {tier}
      </span>
    );
  }

  if (dataSource) {
    const dsColors = {
      primary: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      modeled: 'bg-purple-50 text-purple-800 border border-purple-200',
      mixed: 'bg-amber-50 text-amber-800 border border-amber-200',
    };
    return (
      <span className={`inline-flex items-center font-mono-data font-medium rounded ${sizeClasses} ${dsColors[dataSource]} ${className}`}>
        {dataSource}
      </span>
    );
  }

  const variantClasses = {
    compliant: 'badge-compliant',
    'at-risk': 'badge-at-risk',
    critical: 'badge-critical',
    pending: 'badge-pending',
    tier: 'bg-stone-100 text-stone-800 border border-stone-300',
    'data-source': 'bg-blue-50 text-blue-800 border border-blue-200',
  };

  return (
    <span className={`inline-flex items-center font-mono-data font-medium rounded-md ${variantClasses[variant || 'pending']} ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
};
