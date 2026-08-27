import React, { useState } from 'react';
import { api } from '../api/client';
import { Modal } from './Modal';
import { toast } from '../context/ToastContext';
import { Shield, Mail, Lock, UserPlus } from 'lucide-react';

interface RegisterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterManagerModal: React.FC<RegisterManagerModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'ADMIN'>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.registerUser({ email, password, role });
      toast.success(`${role === 'ADMIN' ? 'Admin' : 'Manager'} account created successfully!`);
      setEmail('');
      setPassword('');
      setRole('MANAGER');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register administrative account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Admin / Manager User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            User Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('MANAGER')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                role === 'MANAGER'
                  ? 'bg-[#c29b38]/15 border-[#c29b38] text-[#876420]'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Department Manager</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                role === 'ADMIN'
                  ? 'bg-[#c29b38]/15 border-[#c29b38] text-[#876420]'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Super Admin</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager.frontdesk@noruhotel.com"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 focus:border-[#c29b38] focus:ring-1 focus:ring-[#c29b38] rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Account Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Initial password (min 6 chars)"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 focus:border-[#c29b38] focus:ring-1 focus:ring-[#c29b38] rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#d1ab45] hover:to-[#b38c2c] rounded-xl shadow transition disabled:opacity-50 flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{loading ? 'Creating...' : 'Create Account'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
