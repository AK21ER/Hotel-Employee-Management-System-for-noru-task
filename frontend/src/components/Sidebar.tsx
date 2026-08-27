import React, { useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Clock,
  ClipboardList,
  BarChart3,
  LogOut,
  KeyRound,
  UserPlus,
  ExternalLink,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { RegisterManagerModal } from './RegisterManagerModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRegisterManager, setShowRegisterManager] = useState(false);

  // Grouped Navigation Items with role permissions
  const navSections = [
    {
      title: 'Operations',
      items: [
        {
          id: 'employees',
          label: 'Employees Directory',
          icon: Users,
          roles: ['ADMIN', 'MANAGER'],
          requiredRole: 'Manager/Admin',
        },
        {
          id: 'attendance',
          label: isStaff ? 'My Attendance' : 'Attendance Logs',
          icon: ClipboardList,
          roles: ['ADMIN', 'MANAGER', 'STAFF'],
        },
        {
          id: 'shifts',
          label: isStaff ? 'My Shifts' : 'Shift Scheduling',
          icon: Clock,
          roles: ['ADMIN', 'MANAGER', 'STAFF'],
        },
      ],
    },
    {
      title: 'Analytics & Insights',
      items: [
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
          roles: ['ADMIN', 'MANAGER'],
          requiredRole: 'Manager/Admin',
        },
      ],
    },
    {
      title: 'Hotel Management',
      items: [
        {
          id: 'departments',
          label: 'Departments',
          icon: Building2,
          roles: ['ADMIN'],
          requiredRole: 'Admin Only',
        },
        {
          id: 'roles',
          label: 'Designations & Roles',
          icon: Briefcase,
          roles: ['ADMIN'],
          requiredRole: 'Admin Only',
        },
      ],
    },
  ];

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-200 border-purple-400/40';
      case 'MANAGER':
        return 'bg-[#c29b38]/30 text-[#f6e7c1] border-[#c29b38]/50';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-600';
    }
  };

  const handleNavClick = (tabId: string, isAllowed: boolean) => {
    if (!isAllowed) return;
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 h-screen max-h-screen bg-[#160e06] text-[#f8f5ee] border-r border-[#c29b38]/25 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. Top Brand Area (Fixed Header) */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-[#c29b38]/20 flex items-center justify-between bg-[#160e06]">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavClick(isStaff ? 'shifts' : 'employees', true)}
          >
            {/* Gold Emblem */}
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#c29b38] via-[#a9822a] to-[#876420] text-white flex items-center justify-center shadow-lg shadow-[#c29b38]/25 border border-[#e3cfa1]/40 group-hover:scale-105 transition transform flex-shrink-0">
              <span className="font-black text-sm tracking-wider">NORU</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-[#c29b38] transition truncate">
                  NORU BOOKING
                </span>
                <span className="px-1.5 py-0.2 text-[8px] font-extrabold bg-[#c29b38]/20 text-[#e3cfa1] border border-[#c29b38]/40 rounded">
                  HRMS
                </span>
              </div>
              <span className="block text-[10px] text-[#c29b38] font-medium tracking-wide truncate">
                MAF Building 5th Floor
              </span>
            </div>
          </div>

          {/* Close Button on Mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#e3cfa1]/70 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Links (Scrollable Middle Area) */}
        <nav className="flex-1 overflow-y-auto min-h-0 p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-[#c29b38]/30 scrollbar-track-transparent">
          {navSections.map((section) => {
            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#c29b38]/80 mb-1.5 flex items-center justify-between">
                  <span>{section.title}</span>
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isAllowed = !user || item.roles.includes(user.role);
                  const isActive = activeTab === item.id && isAllowed;

                  if (!isAllowed) {
                    // Show subtle locked item to inform user of role permissions
                    return (
                      <div
                        key={item.id}
                        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-stone-500 bg-white/[0.02] border border-transparent cursor-not-allowed opacity-60"
                        title={`Restricted: Requires ${item.requiredRole} privileges`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <Icon className="w-4 h-4 flex-shrink-0 text-stone-600" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[9px] text-amber-500/70 font-semibold">
                          <Lock className="w-3 h-3" />
                          <span className="hidden sm:inline">{item.requiredRole}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id, isAllowed)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#c29b38] to-[#a9822a] text-white shadow-md shadow-[#c29b38]/25 border border-[#e3cfa1]/30 font-bold'
                          : 'text-[#e3cfa1]/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-[#c29b38] group-hover:scale-110'
                          } transition`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* 3. Bottom User Profile Card & Quick Actions (Fixed Footer) */}
        <div className="flex-shrink-0 p-3.5 border-t border-[#c29b38]/20 bg-[#120a04]/90 space-y-2.5">
          {user && (
            <div className="p-3 bg-[#1e1309] border border-[#c29b38]/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {user.employee
                      ? `${user.employee.firstName} ${user.employee.lastName}`
                      : user.email}
                  </div>
                  <div className="text-[10px] text-[#e3cfa1]/70 truncate">
                    {user.employee?.department?.name ||
                      (user.role === 'ADMIN' ? 'System Administrator' : user.email)}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase border rounded-md flex-shrink-0 ${getRoleBadgeStyle(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowRegisterManager(true)}
                    className="py-1.5 px-2 rounded-lg bg-[#2a1d10] hover:bg-[#3d2a17] text-[#e3cfa1] border border-[#c29b38]/30 transition text-[10px] font-semibold flex items-center justify-center space-x-1 col-span-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#c29b38]" />
                    <span>New Manager Account</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="py-1.5 px-2 rounded-lg bg-[#2a1d10] hover:bg-[#3d2a17] text-[#e3cfa1] border border-[#c29b38]/30 transition text-[10px] font-semibold flex items-center justify-center space-x-1"
                  title="Change Password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#c29b38]" />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="py-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition text-[10px] font-semibold flex items-center justify-center space-x-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Swagger link */}
          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noreferrer"
            className="w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold bg-[#1e1309] hover:bg-[#281a0d] text-[#e3cfa1]/90 border border-[#c29b38]/25 transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c29b38] animate-pulse"></span>
              <span>OpenAPI Swagger Docs</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#c29b38]" />
          </a>
        </div>
      </aside>

      {/* Voluntary Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Admin Register User Modal */}
      <RegisterManagerModal
        isOpen={showRegisterManager}
        onClose={() => setShowRegisterManager(false)}
      />
    </>
  );
};
