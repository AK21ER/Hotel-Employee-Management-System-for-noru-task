import React, { useState, useEffect } from 'react';
import { api, Employee, Department, Role } from '../api/client';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import {
  UserPlus,
  Search,
  Edit2,
  UserX,
  Phone,
  Mail,
  Calendar,
  Building2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [roleFilter, setRoleFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: new Date().toISOString().split('T')[0],
    departmentId: 0,
    roleId: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, deptRes, roleRes] = await Promise.all([
        api.getEmployees({
          search: search.trim() || undefined,
          departmentId: deptFilter,
          roleId: roleFilter,
          status: statusFilter || undefined,
          page,
          pageSize: 10,
        }),
        api.getDepartments(),
        api.getRoles(),
      ]);

      setEmployees(empRes.data || []);
      if (empRes.pagination) {
        setTotalPages(empRes.pagination.totalPages);
        setTotalRecords(empRes.pagination.total);
      }
      setDepartments(deptRes.data || []);
      setRoles(roleRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, deptFilter, roleFilter, statusFilter, page]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      hireDate: new Date().toISOString().split('T')[0],
      departmentId: departments[0]?.id || 0,
      roleId: roles[0]?.id || 0,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      hireDate: emp.hireDate.split('T')[0],
      departmentId: emp.departmentId,
      roleId: emp.roleId,
      status: emp.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, {
          ...formData,
          departmentId: Number(formData.departmentId),
          roleId: Number(formData.roleId),
        });
        setSuccessMsg(`Employee ${formData.firstName} ${formData.lastName} updated successfully.`);
      } else {
        await api.createEmployee({
          ...formData,
          departmentId: Number(formData.departmentId),
          roleId: Number(formData.roleId),
        });
        setSuccessMsg(`Employee ${formData.firstName} ${formData.lastName} created successfully.`);
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await api.deleteEmployee(deletingEmployee.id);
      setSuccessMsg(`Employee ${deletingEmployee.firstName} ${deletingEmployee.lastName} has been soft-deleted (status: INACTIVE).`);
      setIsDeleteModalOpen(false);
      setDeletingEmployee(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#ecdcb7]/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c29b38]"></span>
            <h1 className="text-2xl font-extrabold text-[#1d140d] tracking-tight">
              Employee Directory
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage hotel staff profiles, departmental allocations, and employment records.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38] transition"
          />
        </div>

        {/* Department Filter */}
        <select
          value={deptFilter || ''}
          onChange={(e) => {
            setDeptFilter(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38] transition"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter || ''}
          onChange={(e) => {
            setRoleFilter(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
          className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38] transition"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38] transition"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Staff</option>
          <option value="INACTIVE">Inactive / Soft-Deleted</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No employees found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting search filters or adding a new employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfaf6] text-xs font-bold text-[#876420] uppercase tracking-wider border-b border-[#ecdcb7]">
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Contact</th>
                  <th className="py-3.5 px-6">Department & Role</th>
                  <th className="py-3.5 px-6">Hire Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#faf6ee]/50 transition group">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c29b38] to-[#1b1208] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-slate-400">ID: #{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#c29b38]" />
                          <span>{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="inline-flex items-center space-x-1 text-xs font-semibold text-[#876420] bg-[#f9f5ea] px-2 py-0.5 rounded-md border border-[#ecdcb7]">
                          <Building2 className="w-3 h-3 text-[#c29b38]" />
                          <span>{emp.department?.name || 'Unassigned'}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{emp.role?.title || 'Unassigned'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(emp.hireDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={emp.status} variant="employment" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#c29b38] hover:bg-[#f9f5ea] transition"
                          title="Edit employee"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {emp.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setDeletingEmployee(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Soft delete (deactivate)"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={10}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Employee Profile' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0100"
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value={0} disabled>Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Role *
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value={0} disabled>Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hire Date *
              </label>
              <input
                type="date"
                required
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Employment Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
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
              {editingEmployee ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Soft-Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Soft Delete"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div className="text-xs">
              <strong className="block text-amber-900 font-semibold mb-0.5">Soft-Delete Architectural Decision</strong>
              Deactivating this employee sets their status to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">INACTIVE</code> to preserve historical attendance & shift data integrity.
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Are you sure you want to deactivate{' '}
            <strong className="text-slate-900 font-semibold">
              {deletingEmployee?.firstName} {deletingEmployee?.lastName}
            </strong>
            ?
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSoftDelete}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition"
            >
              Deactivate Employee
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
