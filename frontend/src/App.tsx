import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { ForceChangePasswordModal } from './components/ForceChangePasswordModal';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { RolesPage } from './pages/RolesPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { AttendancePage } from './pages/AttendancePage';
import { ReportsPage } from './pages/ReportsPage';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('shifts');

  useEffect(() => {
    if (user) {
      if (user.role === 'STAFF') {
        setActiveTab('shifts');
      } else if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        setActiveTab('employees');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#140c05] text-[#e3cfa1]">
        <div className="relative h-16 w-16 mb-4 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-[#c29b38] border-t-transparent rounded-full animate-spin" />
          <span className="absolute font-black text-xs text-[#c29b38]">NORU</span>
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase">Loading Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Active tab guards based on RBAC permissions
  const canAccessEmployees = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canAccessReports = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canAccessAdminOnly = user.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f4] text-slate-900 selection:bg-[#c29b38] selection:text-white relative">
      {/* Forced Password Change Modal */}
      {user.mustChangePassword && <ForceChangePasswordModal />}

      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'employees' && canAccessEmployees && <EmployeesPage />}
        {activeTab === 'departments' && canAccessAdminOnly && <DepartmentsPage />}
        {activeTab === 'roles' && canAccessAdminOnly && <RolesPage />}
        {activeTab === 'shifts' && <ShiftsPage />}
        {activeTab === 'attendance' && <AttendancePage />}
        {activeTab === 'reports' && canAccessReports && <ReportsPage />}
      </main>

      {/* Footer */}
      <footer className="bg-[#1b1208] text-[#e3cfa1] border-t border-[#c29b38]/30 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="px-2 py-0.5 rounded bg-[#c29b38] text-white font-extrabold text-[11px] tracking-wider shadow-sm">
              NORU
            </div>
            <span className="font-semibold text-white">NORU BOOKING & HOTEL HRMS</span>
            <span className="text-[#c29b38]">•</span>
            <span className="text-[#e3cfa1]/80">MAF BUILDING 5th Floor • 09 77 20 21 22</span>
          </div>
          <div className="flex items-center space-x-3 text-[#e3cfa1]/60 text-[11px]">
            <span>PostgreSQL + Prisma + Express + React + Tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
