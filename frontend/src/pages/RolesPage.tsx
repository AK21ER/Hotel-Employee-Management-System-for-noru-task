import React, { useState, useEffect } from 'react';
import { api, Role } from '../api/client';
import { Modal } from '../components/Modal';
import { Briefcase, Plus, Edit2, Trash2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRoles();
      setRoles(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormData({ title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ title: role.title, description: role.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, formData);
        setSuccessMsg(`Role "${formData.title}" updated successfully.`);
      } else {
        await api.createRole(formData);
        setSuccessMsg(`Role "${formData.title}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchRoles();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete role "${role.title}"?`)) return;
    try {
      await api.deleteRole(role.id);
      setSuccessMsg(`Role "${role.title}" deleted.`);
      fetchRoles();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#ecdcb7]/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c29b38]"></span>
            <h1 className="text-2xl font-extrabold text-[#1d140d] tracking-tight">
              Job Roles & Titles
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Define designations, responsibilities, and hotel operational positions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No roles configured.</div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-2xl p-6 border border-[#ecdcb7]/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#f9f5ea] text-[#876420] flex items-center justify-center border border-[#ecdcb7]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#c29b38] hover:bg-[#f9f5ea] transition"
                      title="Edit role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                      title="Delete role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#1d140d] mt-4">{role.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {role.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#ecdcb7]/50 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1 font-semibold text-[#876420]">
                  <Users className="w-3.5 h-3.5 text-[#c29b38]" />
                  <span>{role._count?.employees ?? 0} Staff Members</span>
                </span>
                <span className="text-slate-400">ID: #{role.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Edit Role' : 'Create Role'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Front Desk Agent, Head Chef"
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key job responsibilities and duties..."
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ecdcb7]/60">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white shadow-md shadow-[#c29b38]/20 transition"
            >
              {editingRole ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
