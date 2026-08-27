import React from 'react';
import { Menu, Phone, MapPin, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  onOpenSidebar: () => void;
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  employees: {
    title: 'Employee Directory',
    subtitle: 'Hotel staff allocations, active roles & employment profiles',
  },
  attendance: {
    title: 'Attendance & Time Clock',
    subtitle: 'Real-time punch records and punctuality tracking',
  },
  shifts: {
    title: 'Shifts & Daily Scheduling',
    subtitle: '24/7 rotational shift assignments and daily work rosters',
  },
  departments: {
    title: 'Hotel Departments',
    subtitle: 'Organizational divisions and operational units',
  },
  roles: {
    title: 'Designations & Roles',
    subtitle: 'Job titles, hierarchical positions & responsibilities',
  },
  reports: {
    title: 'Analytics & Reporting',
    subtitle: 'Departmental attendance rates, absenteeism logs & daily rosters',
  },
};

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenSidebar }) => {
  const { user } = useAuth();
  const currentTabInfo = tabTitles[activeTab] || {
    title: 'Operations Dashboard',
    subtitle: 'Hotel employee management & shift control',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#160e06]/95 backdrop-blur-md border-b border-[#c29b38]/25 text-white shadow-md">
      {/* Top micro brand banner */}
      <div className="border-b border-white/5 px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] text-[#e3cfa1]/80">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c29b38] animate-pulse"></span>
          <span className="font-semibold text-white tracking-wide">NORU HOTEL OPERATIONS & HRMS</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 hover:text-[#c29b38] transition">
            <Phone className="w-3 h-3 text-[#c29b38]" />
            <span className="font-bold text-white">09 77 20 21 22</span>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-[#c29b38]" />
            <span>MAF BUILDING 5th Floor</span>
          </div>
          <div className="hidden lg:flex items-center space-x-1">
            <Mail className="w-3 h-3 text-[#c29b38]" />
            <span>norubooking@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main Header bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 rounded-xl bg-[#23170b] hover:bg-[#30200f] text-[#e3cfa1] border border-[#c29b38]/30 lg:hidden transition"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5 text-[#c29b38]" />
          </button>

          {/* Breadcrumb / Page Title */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#c29b38] font-bold uppercase tracking-wider">
              <span>Portal</span>
              <span>/</span>
              <span className="text-[#e3cfa1]">{currentTabInfo.title}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {currentTabInfo.title}
            </h1>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#23170b] border border-[#c29b38]/30 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#c29b38]" />
            <span className="text-[#e3cfa1] font-semibold">
              {user?.role === 'ADMIN'
                ? 'All Departments'
                : user?.employee?.department?.name || 'Front of House'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
