import React, { useState } from 'react';
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
  LogOut,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { RegisterManagerModal } from './RegisterManagerModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegisterManager, setShowRegisterManager] = useState(false);

  const allNavItems = [
    { id: 'employees', label: 'Employees', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    {
      id: 'attendance',
      label: isStaff ? 'My Attendance' : 'Attendance',
      icon: ClipboardList,
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    {
      id: 'shifts',
      label: isStaff ? 'My Shifts' : 'Shifts & Scheduling',
      icon: Clock,
      roles: ['ADMIN', 'MANAGER', 'STAFF'],
    },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['ADMIN'] },
    { id: 'roles', label: 'Roles', icon: Briefcase, roles: ['ADMIN'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  ];

  const visibleNavItems = allNavItems.filter((item) => !user || item.roles.includes(user.role));

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/60 text-purple-200 border-purple-400/40';
      case 'MANAGER':
        return 'bg-[#c29b38]/30 text-[#f6e7c1] border-[#c29b38]/50';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-600';
    }
  };

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
              onClick={() => setActiveTab(visibleNavItems[0]?.id || 'shifts')}
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
              {visibleNavItems.map((item) => {
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

            {/* User Session & Role Controls */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-2.5">
                  <div className="hidden xl:flex flex-col text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <span className="text-xs font-bold text-white leading-tight">
                        {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase border rounded-md ${getRoleBadgeStyle(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#e3cfa1]/70">
                      {user.employee?.department?.name || (user.role === 'ADMIN' ? 'System Administrator' : user.email)}
                    </span>
                  </div>

                  {/* Admin New User Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowRegisterManager(true)}
                      className="p-1.5 rounded-lg bg-[#2a1d10] hover:bg-[#3d2a17] text-[#e3cfa1] border border-[#c29b38]/40 transition text-xs font-semibold flex items-center space-x-1"
                      title="Register New Admin or Manager"
                    >
                      <UserPlus className="w-4 h-4 text-[#c29b38]" />
                      <span className="hidden sm:inline text-[11px]">New Account</span>
                    </button>
                  )}

                  {/* Change Password Button */}
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="p-1.5 rounded-lg bg-[#2a1d10] hover:bg-[#3d2a17] text-[#e3cfa1] border border-[#c29b38]/40 transition text-xs"
                    title="Change Password"
                  >
                    <KeyRound className="w-4 h-4 text-[#c29b38]" />
                  </button>

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition text-xs flex items-center space-x-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="flex md:hidden overflow-x-auto py-2.5 space-x-1.5 border-t border-white/10 no-scrollbar">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-[#c29b38] text-white'
                      : 'text-[#e3cfa1]/80 hover:text-white hover:bg-white/10'
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

      {/* Voluntary Change Password Modal */}
      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />

      {/* Admin Register User Modal */}
      <RegisterManagerModal isOpen={showRegisterManager} onClose={() => setShowRegisterManager(false)} />
    </header>
  );
};
