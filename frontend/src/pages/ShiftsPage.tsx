import React, { useState, useEffect } from 'react';
import { api, Shift, ShiftAssignment, Employee, Department } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  UserCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'definitions'>('schedule');

  // Shifts definitions
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Shift assignments
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // Filters for assignments
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState<number | undefined>();
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1);
  const [assignmentTotalRecords, setAssignmentTotalRecords] = useState(0);

  // Modals & messages
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '07:00', endTime: '15:00' });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    employeeId: 0,
    shiftId: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const res = await api.getShifts();
      setShifts(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const res = await api.getShiftAssignments({
        search: isStaff ? user?.employee?.firstName : filterSearch.trim() || undefined,
        date: filterDate || undefined,
        departmentId: filterDept,
        page: assignmentPage,
        pageSize: 15,
      });
      setAssignments(res.data || []);
      if (res.pagination) {
        setAssignmentTotalPages(res.pagination.totalPages);
        setAssignmentTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.getEmployees({ status: 'ACTIVE', pageSize: 100 }).catch(() => ({ data: [] })),
        api.getDepartments().catch(() => ({ data: [] })),
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShifts();
    if (!isStaff) {
      fetchMetadata();
    }
  }, [isStaff]);

  useEffect(() => {
    fetchAssignments();
  }, [filterDate, filterDept, filterSearch, assignmentPage]);

  // Handle shift definition CRUD
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (editingShift) {
        await api.updateShift(editingShift.id, shiftForm);
        const msg = `Shift "${shiftForm.name}" updated successfully.`;
        setSuccessMsg(msg);
        toast.success(msg, 'Shift Updated');
      } else {
        await api.createShift(shiftForm);
        const msg = `Shift "${shiftForm.name}" created successfully.`;
        setSuccessMsg(msg);
        toast.success(msg, 'Shift Created');
      }
      setIsShiftModalOpen(false);
      fetchShifts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteShift = async (s: Shift) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete shift "${s.name}"?`)) return;
    try {
      await api.deleteShift(s.id);
      const msg = `Shift "${s.name}" deleted.`;
      setSuccessMsg(msg);
      toast.warning(msg, 'Shift Deleted');
      fetchShifts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle shift assignment
  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaff) return;
    try {
      await api.createShiftAssignment({
        employeeId: Number(assignForm.employeeId),
        shiftId: Number(assignForm.shiftId),
        date: assignForm.date,
      });
      const msg = `Shift assigned successfully for date ${assignForm.date}.`;
      setSuccessMsg(msg);
      toast.success(msg, 'Shift Scheduled');
      setIsAssignModalOpen(false);
      fetchAssignments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (isStaff) return;
    if (!window.confirm('Remove this shift assignment?')) return;
    try {
      await api.deleteShiftAssignment(id);
      const msg = 'Shift assignment removed.';
      setSuccessMsg(msg);
      toast.info(msg, 'Assignment Removed');
      fetchAssignments();
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
              {isStaff ? 'My Assigned Shifts & Work Hours' : 'Shifts & Work Schedules'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff
              ? 'View your personal daily shift schedule, reporting times, and operational hours.'
              : 'Manage 24/7 hotel operational shifts and daily staff assignments.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isStaff && activeSubTab === 'schedule' && (
            <button
              onClick={() => {
                setAssignForm({
                  employeeId: employees[0]?.id || 0,
                  shiftId: shifts[0]?.id || 0,
                  date: filterDate || new Date().toISOString().split('T')[0],
                });
                setIsAssignModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Schedule Shift</span>
            </button>
          )}
          {isAdmin && activeSubTab === 'definitions' && (
            <button
              onClick={() => {
                setEditingShift(null);
                setShiftForm({ name: '', startTime: '07:00', endTime: '15:00' });
                setIsShiftModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Shift Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-[#ecdcb7]">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'schedule'
              ? 'border-[#c29b38] text-[#876420]'
              : 'border-transparent text-slate-500 hover:text-[#c29b38]'
          }`}
        >
          {isStaff ? 'My Schedule' : 'Daily Schedule & Assignments'}
        </button>
        <button
          onClick={() => setActiveSubTab('definitions')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'definitions'
              ? 'border-[#c29b38] text-[#876420]'
              : 'border-transparent text-slate-500 hover:text-[#c29b38]'
          }`}
        >
          Shift Types & Hours
        </button>
      </div>

      {/* Notifications */}
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

      {/* SUB-TAB 1: DAILY SCHEDULE */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name..."
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(e.target.value);
                  setAssignmentPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#c29b38]" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setAssignmentPage(1);
                }}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#c29b38]" />
              <select
                value={filterDept || ''}
                onChange={(e) => {
                  setFilterDept(e.target.value ? Number(e.target.value) : undefined);
                  setAssignmentPage(1);
                }}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
            {loadingAssignments ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-slate-500 font-medium">Loading schedule...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No shift assignments for this date</p>
                <p className="text-xs text-slate-400 mt-1">Use the "Schedule Shift" button to assign staff.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fcfaf6] text-xs font-bold text-[#876420] uppercase tracking-wider border-b border-[#ecdcb7]">
                      <th className="py-3.5 px-6">Employee</th>
                      <th className="py-3.5 px-6">Department & Role</th>
                      <th className="py-3.5 px-6">Assigned Shift</th>
                      <th className="py-3.5 px-6">Shift Timing</th>
                      <th className="py-3.5 px-6">Attendance Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {assignments.map((asg) => (
                      <tr key={asg.id} className="hover:bg-[#faf6ee]/50 transition">
                        <td className="py-4 px-6 font-medium text-slate-900">
                          {asg.employee.firstName} {asg.employee.lastName}
                          <div className="text-xs text-slate-400 font-normal">{asg.employee.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs font-semibold text-slate-700">{asg.employee.department.name}</div>
                          <div className="text-xs text-slate-400">{asg.employee.role.title}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#f9f5ea] text-[#876420] border border-[#ecdcb7]">
                            {asg.shift.name}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                          {asg.shift.startTime} — {asg.shift.endTime}
                        </td>
                        <td className="py-4 px-6">
                          {asg.attendance ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {asg.attendance.status}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Not logged</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteAssignment(asg.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              currentPage={assignmentPage}
              totalPages={assignmentTotalPages}
              totalRecords={assignmentTotalRecords}
              pageSize={15}
              onPageChange={(p) => setAssignmentPage(p)}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SHIFT DEFINITIONS */}
      {activeSubTab === 'definitions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loadingShifts ? (
            <div className="col-span-full py-16 text-center text-slate-400">Loading shift types...</div>
          ) : (
            shifts.map((shift) => (
              <div
                key={shift.id}
                className="bg-white rounded-2xl p-6 border border-[#ecdcb7]/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#f9f5ea] text-[#876420] flex items-center justify-center border border-[#ecdcb7]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingShift(shift);
                          setShiftForm({
                            name: shift.name,
                            startTime: shift.startTime,
                            endTime: shift.endTime,
                          });
                          setIsShiftModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#c29b38] hover:bg-[#f9f5ea] transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{shift.name}</h3>
                  <div className="mt-3 flex items-center space-x-2 text-slate-700 bg-[#fdfbf7] p-2.5 rounded-xl font-mono text-sm border border-[#ecdcb7]">
                    <Clock className="w-4 h-4 text-[#c29b38]" />
                    <span>{shift.startTime}</span>
                    <span className="text-slate-400">to</span>
                    <span>{shift.endTime}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#ecdcb7]/50 flex items-center justify-between text-xs text-slate-400">
                  <span>24h Time Format</span>
                  <span>ID: #{shift.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shift Type Modal */}
      <Modal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title={editingShift ? 'Edit Shift Definition' : 'Create Shift Definition'}
      >
        <form onSubmit={handleSaveShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Shift Name *
            </label>
            <input
              type="text"
              required
              value={shiftForm.name}
              onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
              placeholder="e.g. Morning Shift, Night Shift"
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Time (HH:mm) *
              </label>
              <input
                type="text"
                required
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="07:00"
                value={shiftForm.startTime}
                onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Time (HH:mm) *
              </label>
              <input
                type="text"
                required
                pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                placeholder="15:00"
                value={shiftForm.endTime}
                onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ecdcb7]/60">
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white shadow-md shadow-[#c29b38]/20 transition"
            >
              Save Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Shift Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Schedule Staff Shift"
      >
        <form onSubmit={handleAssignShift} className="space-y-4">
          <div className="text-xs bg-[#f9f5ea] text-[#876420] p-3 rounded-xl border border-[#ecdcb7]">
            <strong>Unique Daily Assignment:</strong> The database enforces <code className="font-mono">UNIQUE(employeeId, date)</code> to prevent double-booking.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee *
            </label>
            <select
              required
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            >
              <option value={0} disabled>Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.department.name} - {emp.role.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Shift *
            </label>
            <select
              required
              value={assignForm.shiftId}
              onChange={(e) => setAssignForm({ ...assignForm, shiftId: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            >
              <option value={0} disabled>Select Shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={assignForm.date}
              onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ecdcb7]/60">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white shadow-md shadow-[#c29b38]/20 transition"
            >
              Assign Shift
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
