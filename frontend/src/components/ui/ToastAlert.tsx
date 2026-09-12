import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface ToastAlertProps {
  type?: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: string;
  onClose?: () => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  type = 'warning',
  title,
  message,
  timestamp,
  onClose,
}) => {
  const styles = {
    critical: {
      container: 'bg-[#FDF2F0] border-[#C45B4A]/40 text-[#C45B4A]',
      icon: <XCircle className="w-5 h-5 text-[#C45B4A] shrink-0" />,
      badge: 'bg-[#C45B4A] text-white',
    },
    warning: {
      container: 'bg-[#FDF9EE] border-[#D4A843]/40 text-[#9C7720]',
      icon: <AlertTriangle className="w-5 h-5 text-[#D4A843] shrink-0" />,
      badge: 'bg-[#D4A843] text-white',
    },
    info: {
      container: 'bg-[#EEF7F2] border-[#7A9B8A]/40 text-[#1B3A2D]',
      icon: <Info className="w-5 h-5 text-[#7A9B8A] shrink-0" />,
      badge: 'bg-[#1B3A2D] text-white',
    },
    success: {
      container: 'bg-[#EEF7F2] border-[#2D6A4F]/40 text-[#2D6A4F]',
      icon: <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] shrink-0" />,
      badge: 'bg-[#2D6A4F] text-white',
    },
  };

  const style = styles[type];

  return (
    <div className={`p-4 rounded-lg border flex items-start justify-between space-x-3 text-sm transition-all ${style.container}`}>
      <div className="flex items-start space-x-3">
        {style.icon}
        <div>
          <div className="flex items-center space-x-2">
            <span className={`px-1.5 py-0.5 text-[10px] font-mono-data uppercase font-bold rounded ${style.badge}`}>
              {type}
            </span>
            <span className="font-heading font-semibold text-base tracking-tight">{title}</span>
          </div>
          <p className="mt-1 font-sans text-xs leading-relaxed opacity-90">{message}</p>
          {timestamp && (
            <span className="block mt-1 font-mono-data text-[10px] opacity-75">
              UPDATED {timestamp}
            </span>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 focus:outline-none p-1 rounded hover:bg-black/5"
        >
          ×
        </button>
      )}
    </div>
  );
};
