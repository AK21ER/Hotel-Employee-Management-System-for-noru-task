import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Clock,
  ClipboardList,
  BarChart3,
  Phone,
  MapPin,
  Mail,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'shifts', label: 'Shifts & Scheduling', icon: Clock },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'roles', label: 'Roles', icon: Briefcase },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-xl">
      {/* Top Banner with NORU Gold and Espresso Brand Theme */}
      <div className="bg-[#1b1208] text-white border-b border-[#c29b38]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-2.5 gap-2 text-xs border-b border-white/5">
            <div className="flex items-center space-x-2 text-[#e3cfa1]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#c29b38] animate-pulse"></span>
              <span className="font-medium tracking-wide">NORU HOTEL OPERATIONS & HRMS</span>
            </div>

            {/* Quick Contact info directly from brand banner */}
            <div className="flex flex-wrap items-center gap-4 text-[#e3cfa1]/90 text-[11px]">
              <div className="flex items-center space-x-1.5 hover:text-[#c29b38] transition">
                <Phone className="w-3.5 h-3.5 text-[#c29b38]" />
                <span className="font-semibold text-white">09 77 20 21 22</span>
              </div>
              <div className="flex items-center space-x-1.5 hidden md:flex">
                <MapPin className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>MAF BUILDING 5<sup>th</sup> Floor</span>
              </div>
              <div className="flex items-center space-x-1.5 hidden lg:flex">
                <Mail className="w-3.5 h-3.5 text-[#c29b38]" />
                <span>norubooking@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo matching the banner */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('employees')}
            >
              {/* Bowing Figures Silhouette Icon in Gold Badge */}
              <div className="relative h-11 px-3 rounded-xl bg-gradient-to-br from-[#c29b38] via-[#a9822a] to-[#876420] text-white flex items-center justify-center shadow-lg shadow-[#c29b38]/20 border border-[#e3cfa1]/40 group-hover:scale-105 transition transform">
                <div className="flex items-center space-x-1 font-black text-lg tracking-widest uppercase">
                  <span className="text-white drop-shadow">NORU</span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#c29b38] transition">
                    NORU BOOKING
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#c29b38]/20 text-[#e3cfa1] border border-[#c29b38]/40 rounded">
                    HRMS
                  </span>
                </div>
                <span className="block text-[11px] text-[#c29b38] font-medium tracking-wide">
                  Hotel Staff & Shift Management
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#c29b38] to-[#a9822a] text-white shadow-md shadow-[#c29b38]/30 border border-[#e3cfa1]/30'
                        : 'text-[#e3cfa1]/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#c29b38]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* External Swagger Link */}
            <div className="flex items-center space-x-3">
              <a
                href="http://localhost:5000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2a1d10] hover:bg-[#352515] text-[#e3cfa1] border border-[#c29b38]/40 transition shadow-sm"
                title="Open Swagger OpenAPI Documentation"
              >
                <span>Swagger API</span>
                <span className="w-2 h-2 rounded-full bg-[#c29b38] animate-pulse"></span>
              </a>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex space-x-1 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold transition ${
                    isActive
                      ? 'bg-[#c29b38] text-white shadow-sm'
                      : 'text-[#e3cfa1]/90 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
