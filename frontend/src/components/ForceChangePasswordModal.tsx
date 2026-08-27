import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Lock, LogOut } from 'lucide-react';

export const ForceChangePasswordModal: React.FC = () => {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await changePassword({ currentPassword, newPassword });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#1e140a] border-2 border-[#c29b38] rounded-3xl p-7 shadow-2xl shadow-black">
        <div className="flex items-center space-x-3 text-[#c29b38] mb-4">
          <div className="p-3 bg-[#c29b38]/20 border border-[#c29b38]/40 rounded-2xl">
            <ShieldAlert className="w-6 h-6 text-[#c29b38]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Password Change Required</h2>
            <p className="text-xs text-[#e3cfa1]/80">Please set a new secure password to proceed</p>
          </div>
        </div>

        <div className="mb-5 p-3 bg-[#2a1d10] border border-[#c29b38]/30 rounded-xl text-xs text-[#e3cfa1] leading-relaxed">
          Your account was provisioned with a temporary password. You must set a personal password before accessing hotel management tools.
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#e3cfa1] uppercase tracking-wider mb-1">
              Current Temporary Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#c29b38]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current / temp password"
                className="w-full pl-9 pr-3 py-2 bg-[#140c05] border border-[#c29b38]/40 focus:border-[#c29b38] rounded-xl text-sm text-white placeholder-stone-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#e3cfa1] uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#c29b38]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full pl-9 pr-3 py-2 bg-[#140c05] border border-[#c29b38]/40 focus:border-[#c29b38] rounded-xl text-sm text-white placeholder-stone-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#e3cfa1] uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#c29b38]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-3 py-2 bg-[#140c05] border border-[#c29b38]/40 focus:border-[#c29b38] rounded-xl text-sm text-white placeholder-stone-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#e3cfa1] hover:text-white bg-transparent hover:bg-white/10 border border-white/20 transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#d1ab45] hover:to-[#b38c2c] shadow-lg shadow-[#c29b38]/20 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              {loading ? 'Updating Password...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
