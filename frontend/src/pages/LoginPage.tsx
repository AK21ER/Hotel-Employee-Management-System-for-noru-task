import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, KeyRound, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#140c05] text-[#f8f5ee] px-4 py-12 relative overflow-hidden selection:bg-[#c29b38] selection:text-white">
      {/* Subtle gold ambient glow in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#c29b38]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#876420]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 px-5 rounded-2xl bg-gradient-to-br from-[#c29b38] via-[#a9822a] to-[#876420] text-white shadow-2xl shadow-[#c29b38]/30 border border-[#e3cfa1]/30 mb-4 transform hover:scale-105 transition">
            <span className="font-black text-2xl tracking-widest">NORU</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hotel Employee Management
          </h1>
          <p className="text-sm text-[#e3cfa1]/80 mt-1 font-medium">
            MAF BUILDING 5th Floor • Operations & HR Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1e140a]/90 backdrop-blur-xl border border-[#c29b38]/30 rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex items-center justify-between border-b border-[#c29b38]/20 pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#c29b38]" />
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Sign In</h2>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#c29b38]/20 text-[#e3cfa1] border border-[#c29b38]/40 rounded-full">
              RBAC Protected
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start space-x-2">
              <span className="font-bold text-red-400">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#e3cfa1] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c29b38]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@noruhotel.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#140c05] border border-[#c29b38]/40 focus:border-[#c29b38] focus:ring-2 focus:ring-[#c29b38]/30 rounded-xl text-sm text-white placeholder-stone-500 transition outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e3cfa1] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#c29b38]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#140c05] border border-[#c29b38]/40 focus:border-[#c29b38] focus:ring-2 focus:ring-[#c29b38]/30 rounded-xl text-sm text-white placeholder-stone-500 transition outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#c29b38] via-[#b38c2c] to-[#997320] hover:from-[#d1ab45] hover:to-[#a88028] shadow-lg shadow-[#c29b38]/25 border border-[#e3cfa1]/30 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-7 pt-5 border-t border-[#c29b38]/20">
            <div className="flex items-center space-x-1.5 mb-3 text-[11px] font-bold tracking-wider uppercase text-[#e3cfa1]/70">
              <Sparkles className="w-3.5 h-3.5 text-[#c29b38]" />
              <span>Quick Demo Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@noruhotel.com', 'Admin123!')}
                className="p-2.5 text-left rounded-xl bg-[#140c05]/80 hover:bg-[#c29b38]/20 border border-[#c29b38]/30 hover:border-[#c29b38] transition group"
              >
                <div className="font-bold text-white group-hover:text-[#c29b38] flex items-center space-x-1">
                  <span>👑 Admin</span>
                </div>
                <div className="text-[10px] text-[#e3cfa1]/70 truncate">admin@noruhotel.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager.frontdesk@noruhotel.com', 'Manager123!')}
                className="p-2.5 text-left rounded-xl bg-[#140c05]/80 hover:bg-[#c29b38]/20 border border-[#c29b38]/30 hover:border-[#c29b38] transition group"
              >
                <div className="font-bold text-white group-hover:text-[#c29b38] flex items-center space-x-1">
                  <span>👔 Front Desk Mgr</span>
                </div>
                <div className="text-[10px] text-[#e3cfa1]/70 truncate">manager.frontdesk@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager.housekeeping@noruhotel.com', 'Manager123!')}
                className="p-2.5 text-left rounded-xl bg-[#140c05]/80 hover:bg-[#c29b38]/20 border border-[#c29b38]/30 hover:border-[#c29b38] transition group"
              >
                <div className="font-bold text-white group-hover:text-[#c29b38] flex items-center space-x-1">
                  <span>🧹 Housekeeping Mgr</span>
                </div>
                <div className="text-[10px] text-[#e3cfa1]/70 truncate">manager.housekeeping@...</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('elena.r@hotelhrms.com', 'Staff123!')}
                className="p-2.5 text-left rounded-xl bg-[#140c05]/80 hover:bg-[#c29b38]/20 border border-[#c29b38]/30 hover:border-[#c29b38] transition group"
              >
                <div className="font-bold text-white group-hover:text-[#c29b38] flex items-center space-x-1">
                  <span>🏷️ Staff (Elena)</span>
                </div>
                <div className="text-[10px] text-[#e3cfa1]/70 truncate">elena.r@hotelhrms.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-[#e3cfa1]/60">
          <span>Protected with HTTP-only Cookies & Bcrypt Hashing</span>
        </div>
      </div>
    </div>
  );
};
