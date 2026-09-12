import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  MapPin,
  Lightbulb,
  SlidersHorizontal,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Leaf,
  LogOut
} from 'lucide-react';


interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { label: 'Suppliers', path: '/app/suppliers', icon: Users },
    { label: 'Hierarchy', path: '/app/hierarchy', icon: FolderTree },
    { label: 'Map', path: '/app/map', icon: MapPin },
    { label: 'Recommendations', path: '/app/recommendations', icon: Lightbulb },
    { label: 'Scenarios', path: '/app/scenarios', icon: SlidersHorizontal },
    { label: 'Factors', path: '/app/factors', icon: Database },
    { label: 'Reports', path: '/app/reports', icon: FileSpreadsheet },
  ];


  return (
    <aside className="w-64 bg-[#1B3A2D] text-[#F7F5F0] min-h-screen flex flex-col border-r border-[#254F3E] shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#254F3E]/60 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#7A9B8A]/20 border border-[#7A9B8A]/40 flex items-center justify-center text-[#7A9B8A]">
          <Leaf className="w-5 h-5 text-[#7A9B8A]" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-[#F7F5F0]">
            Carbonix
          </h1>
          <p className="font-mono-data text-[10px] text-[#7A9B8A] tracking-wider uppercase">
            Supply Chain Intel v2.4
          </p>
        </div>
      </div>

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Navigation Items */}
        <nav className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono-data uppercase tracking-widest text-[#7A9B8A]/80 font-semibold">
            Platform Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-sans font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#7A9B8A]/20 text-white font-semibold border-l-4 border-[#7A9B8A] pl-2.5 shadow-xs'
                    : 'text-[#F7F5F0]/80 hover:bg-[#254F3E]/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${
                  isActive ? 'text-[#7A9B8A]' : 'text-[#7A9B8A]/60 group-hover:text-[#7A9B8A]'
                }`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Auditor User Card */}
        <div className="mx-3 mb-4 p-4 rounded-lg border border-[#254F3E]/60 bg-[#12281F]/40 shadow-sm mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#7A9B8A] text-[#1B3A2D] font-bold text-xs flex items-center justify-center">
                HV
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F7F5F0]">Dr. Helen Vance</p>
                <p className="text-[10px] font-mono-data text-[#7A9B8A] flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400 inline" />
                  Lead Auditor
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                className="text-[#7A9B8A]/70 hover:text-rose-400 p-1.5 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
