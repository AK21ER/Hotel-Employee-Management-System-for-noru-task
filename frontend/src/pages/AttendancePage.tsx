import React, { useState, useEffect } from 'react';
import { api, Attendance, Employee, Department } from '../api/client';
import { toast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import {
  ClipboardCheck,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptFilter, setDeptFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Record Attendance Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    employeeId: 0,
    date: new Date().toISOString().split('T')[0],
    checkInTime: '07:15',
    checkOutTime: '15:00',
    includeCheckIn: true,
    includeCheckOut: true,
    explicitStatus: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [attRes, empRes, deptRes] = await Promise.all([
        api.getAttendance({
          from: fromDate || undefined,
          to: toDate || undefined,
          departmentId: deptFilter,
          status: statusFilter || undefined,
          page,
          pageSize: 15,
        }),
        api.getEmployees({ status: 'ACTIVE', pageSize: 100 }),
        api.getDepartments(),
      ]);

      setAttendanceList(attRes.data || []);
      if (attRes.pagination) {
        setTotalPages(attRes.pagination.totalPages);
        setTotalRecords(attRes.pagination.total);
      }
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, deptFilter, statusFilter, page]);

  const handleOpenRecord = () => {
    setRecordForm({
      employeeId: employees[0]?.id || 0,
      date: new Date().toISOString().split('T')[0],
      checkInTime: '07:15',
      checkOutTime: '15:00',
      includeCheckIn: true,
      includeCheckOut: false,
      explicitStatus: '',
    });
    setIsModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let checkInIso: string | null = null;
      let checkOutIso: string | null = null;

      if (recordForm.includeCheckIn && recordForm.checkInTime) {
        checkInIso = `${recordForm.date}T${recordForm.checkInTime}:00`;
      }
      if (recordForm.includeCheckOut && recordForm.checkOutTime) {
        checkOutIso = `${recordForm.date}T${recordForm.checkOutTime}:00`;
      }

      const res = await api.recordAttendance({
        employeeId: Number(recordForm.employeeId),
        date: recordForm.date,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status: recordForm.explicitStatus || null,
      });

      const msg = `Attendance logged for ${res.data.employee.firstName} ${res.data.employee.lastName} (Status: ${res.data.status})`;
      setSuccessMsg(msg);
      toast.success(msg, 'Attendance Recorded');
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 5000);
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
              Attendance & Time Tracking
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time punch records with automated 10-minute grace period late derivation.
          </p>
        </div>
        <button
          onClick={handleOpenRecord}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Attendance</span>
        </button>
      </div>

      {/* Logic Callout */}
      <div className="bg-gradient-to-r from-[#1d140d] via-[#2a1d12] to-[#1d140d] text-white p-4 sm:p-5 rounded-2xl shadow-sm flex items-start space-x-3.5 border border-[#c29b38]/40">
        <div className="p-2 bg-[#c29b38]/20 border border-[#c29b38]/40 rounded-xl">
          <Sparkles className="w-5 h-5 text-[#e3cfa1]" />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-bold text-sm text-[#e3cfa1] block">Automated Status Derivation Rules</span>
          <p className="text-[#e3cfa1]/90 leading-relaxed">
            When check-in is logged, system compares timestamp with assigned shift start time.
            Check-in within <strong>10 minutes grace period</strong> $\to$ <span className="text-emerald-400 font-semibold">PRESENT</span>.
            Check-in &gt; 10 minutes late $\to$ <span className="text-amber-400 font-semibold">LATE</span> (overrides default).
            No check-in provided $\to$ <span className="text-rose-400 font-semibold">ABSENT</span>.
          </p>
        </div>
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
          <select
            value={deptFilter || ''}
            onChange={(e) => {
              setDeptFilter(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
            className="w-full px-3.5 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="ABSENT">ABSENT</option>
            <option value="ON_LEAVE">ON LEAVE</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading attendance records...</p>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No attendance records found</p>
            <p className="text-xs text-slate-400 mt-1">Try expanding the date range or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfaf6] text-xs font-bold text-[#876420] uppercase tracking-wider border-b border-[#ecdcb7]">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Assigned Shift</th>
                  <th className="py-3.5 px-6">Check In / Out</th>
                  <th className="py-3.5 px-6">Derived Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attendanceList.map((att) => {
                  const checkInFormatted = att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const checkOutFormatted = att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                  return (
                    <tr key={att.id} className="hover:bg-[#faf6ee]/50 transition">
                      <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#c29b38]" />
                          <span>{new Date(att.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {att.employee?.firstName} {att.employee?.lastName}
                        <div className="text-xs text-slate-400 font-normal">{att.employee?.role?.title}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#f9f5ea] text-[#876420] border border-[#ecdcb7] font-medium">
                          {att.employee?.department?.name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {att.shiftAssignment ? (
                          <div>
                            <span className="font-semibold text-slate-700">{att.shiftAssignment.shift.name}</span>
                            <div className="text-slate-400 font-mono">({att.shiftAssignment.shift.startTime} - {att.shiftAssignment.shift.endTime})</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No assigned shift</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-700 font-semibold">{checkInFormatted}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-slate-500">{checkOutFormatted}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge status={att.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={15}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Record Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Staff Attendance"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee *
            </label>
            <select
              required
              value={recordForm.employeeId}
              onChange={(e) => setRecordForm({ ...recordForm, employeeId: Number(e.target.value) })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            >
              <option value={0} disabled>Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.department.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Date *
            </label>
            <input
              type="date"
              required
              value={recordForm.date}
              onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>

          <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordForm.includeCheckIn}
                  onChange={(e) => setRecordForm({ ...recordForm, includeCheckIn: e.target.checked })}
                  className="rounded text-[#c29b38] focus:ring-[#c29b38]"
                />
                <span>Include Check-In Time</span>
              </label>
              {recordForm.includeCheckIn && (
                <input
                  type="time"
                  value={recordForm.checkInTime}
                  onChange={(e) => setRecordForm({ ...recordForm, checkInTime: e.target.value })}
                  className="px-2.5 py-1 bg-white border border-[#ecdcb7] rounded-lg text-xs font-mono"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordForm.includeCheckOut}
                  onChange={(e) => setRecordForm({ ...recordForm, includeCheckOut: e.target.checked })}
                  className="rounded text-[#c29b38] focus:ring-[#c29b38]"
                />
                <span>Include Check-Out Time</span>
              </label>
              {recordForm.includeCheckOut && (
                <input
                  type="time"
                  value={recordForm.checkOutTime}
                  onChange={(e) => setRecordForm({ ...recordForm, checkOutTime: e.target.value })}
                  className="px-2.5 py-1 bg-white border border-[#ecdcb7] rounded-lg text-xs font-mono"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Explicit Status Override (Optional)
            </label>
            <select
              value={recordForm.explicitStatus}
              onChange={(e) => setRecordForm({ ...recordForm, explicitStatus: e.target.value })}
              className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            >
              <option value="">Auto-Derive (Recommended)</option>
              <option value="ON_LEAVE">ON LEAVE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
            </select>
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
              Log Attendance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
