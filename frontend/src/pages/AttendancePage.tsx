import React, { useState, useEffect } from 'react';
import { api, Attendance, Employee, Department } from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  Search,
  Edit3,
  Trash2,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, isStaff } = useAuth();
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
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
    includeCheckOut: false,
    explicitStatus: '',
  });

  // Correction Modal (Admin/Manager only)
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctingRecord, setCorrectingRecord] = useState<Attendance | null>(null);
  const [correctForm, setCorrectForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    includeCheckIn: true,
    includeCheckOut: true,
    status: 'PRESENT',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [attRes, empRes, deptRes] = await Promise.all([
        api.getAttendance({
          search: search.trim() || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          departmentId: deptFilter,
          status: statusFilter || undefined,
          page,
          pageSize: 15,
        }),
        isStaff ? Promise.resolve({ data: [] }) : api.getEmployees({ status: 'ACTIVE', pageSize: 100 }).catch(() => ({ data: [] })),
        isStaff ? Promise.resolve({ data: [] }) : api.getDepartments().catch(() => ({ data: [] })),
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
  }, [fromDate, toDate, deptFilter, statusFilter, search, page]);

  const handleOpenRecord = () => {
    setRecordForm({
      employeeId: isStaff ? user?.employeeId || 0 : employees[0]?.id || 0,
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toTimeString().slice(0, 5),
      checkOutTime: '15:00',
      includeCheckIn: true,
      includeCheckOut: false,
      explicitStatus: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenCorrect = (att: Attendance) => {
    setCorrectingRecord(att);
    const inTime = att.checkIn ? new Date(att.checkIn).toTimeString().slice(0, 5) : '07:00';
    const outTime = att.checkOut ? new Date(att.checkOut).toTimeString().slice(0, 5) : '15:00';
    setCorrectForm({
      checkInTime: inTime,
      checkOutTime: outTime,
      includeCheckIn: !!att.checkIn,
      includeCheckOut: !!att.checkOut,
      status: att.status,
    });
    setIsCorrectModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let checkInIso: string | undefined = undefined;
      let checkOutIso: string | undefined = undefined;

      if (recordForm.includeCheckIn && recordForm.checkInTime) {
        checkInIso = `${recordForm.date}T${recordForm.checkInTime}:00`;
      }
      if (recordForm.includeCheckOut && recordForm.checkOutTime) {
        checkOutIso = `${recordForm.date}T${recordForm.checkOutTime}:00`;
      }

      const targetEmpId = isStaff ? (user?.employeeId || 0) : Number(recordForm.employeeId);

      if (isStaff && recordForm.includeCheckOut && !recordForm.includeCheckIn) {
        // Staff Clock Out endpoint
        const res = await api.checkoutAttendance({
          checkOut: checkOutIso,
        });
        const msg = `Clock-out recorded for ${res.data.employee.firstName} ${res.data.employee.lastName}`;
        setSuccessMsg(msg);
        toast.success(msg, 'Checked Out');
      } else {
        // Standard Check-In endpoint
        const res = await api.recordAttendance({
          employeeId: targetEmpId,
          date: recordForm.date,
          checkIn: checkInIso,
          checkOut: checkOutIso,
          status: isStaff ? null : (recordForm.explicitStatus || null),
        });

        const msg = `Attendance logged for ${res.data.employee.firstName} ${res.data.employee.lastName} (Status: ${res.data.status})`;
        setSuccessMsg(msg);
        toast.success(msg, 'Attendance Recorded');
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCorrectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord) return;
    try {
      const recDate = correctingRecord.date.split('T')[0];
      const checkInIso = correctForm.includeCheckIn && correctForm.checkInTime
        ? `${recDate}T${correctForm.checkInTime}:00`
        : null;
      const checkOutIso = correctForm.includeCheckOut && correctForm.checkOutTime
        ? `${recDate}T${correctForm.checkOutTime}:00`
        : null;

      await api.correctAttendance(correctingRecord.id, {
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status: correctForm.status,
      });

      const msg = `Attendance record #${correctingRecord.id} corrected with audit timestamp.`;
      setSuccessMsg(msg);
      toast.success(msg, 'Record Corrected');
      setIsCorrectModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await api.deleteAttendance(id);
      const msg = 'Attendance record deleted.';
      setSuccessMsg(msg);
      toast.info(msg, 'Record Deleted');
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
              {isStaff ? 'My Attendance Records' : 'Attendance & Time Tracking'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff
              ? 'Record your shift punch in/out and view your daily punctuality logs.'
              : 'Automated punctuality derivation, punch-in/out logs, and daily compliance.'}
          </p>
        </div>
        <button
          onClick={handleOpenRecord}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#c29b38] to-[#a9822a] hover:from-[#b89130] hover:to-[#967220] text-white text-sm font-bold rounded-xl shadow-md shadow-[#c29b38]/20 transition transform active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isStaff ? 'Punch In / Clock Out' : 'Log Attendance / Punch'}</span>
        </button>
      </div>

      {/* Logic Callout Notice */}
      <div className="p-4 bg-[#fdfbf7] border border-[#ecdcb7] rounded-2xl flex items-start space-x-3 text-xs text-slate-700 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-[#c29b38] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <span className="font-bold text-[#1d140d]">Automated Punctuality Grace Period: </span>
          The system compares punch-in time against scheduled shift start. Arrivals within the{' '}
          <strong className="text-[#876420]">10-minute grace window</strong> are marked{' '}
          <strong className="text-emerald-700 font-bold">PRESENT</strong>. Check-ins beyond 10 minutes past shift start are automatically flagged as{' '}
          <strong className="text-amber-700 font-bold">LATE</strong>. Missing check-ins default to{' '}
          <strong className="text-rose-700 font-bold">ABSENT</strong>. Approved leaves are preserved as{' '}
          <strong className="text-sky-700 font-bold">ON_LEAVE</strong>.
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
      <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Staff</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
            />
          </div>
        </div>

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
                  <th className="py-3.5 px-6">Status & Audit</th>
                  {!isStaff && <th className="py-3.5 px-6 text-right">Actions</th>}
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
                        <div className="flex flex-col space-y-1">
                          <Badge status={att.status} />
                          {att.correctedAt && (
                            <span
                              className="inline-flex items-center text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold"
                              title={`Corrected on ${new Date(att.correctedAt).toLocaleString()} by ${att.correctedBy?.email || 'Admin'}`}
                            >
                              ✏️ Edited by {att.correctedBy?.email?.split('@')[0] || 'Admin'}
                            </span>
                          )}
                        </div>
                      </td>
                      {!isStaff && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleOpenCorrect(att)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#c29b38] hover:bg-[#f9f5ea] transition"
                              title="Administrative correction"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(att.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete attendance record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
        title={isStaff ? 'Punch In / Out' : 'Record Staff Attendance'}
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee *
            </label>
            {isStaff ? (
              <div className="w-full px-3.5 py-2.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm font-bold text-stone-800 flex items-center justify-between">
                <span>{user?.employee?.firstName} {user?.employee?.lastName}</span>
                <span className="text-xs text-[#876420] font-normal">{user?.employee?.department?.name}</span>
              </div>
            ) : (
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
            )}
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

          {/* Shift Clock-in/out Window Guide */}
          <div className="p-3.5 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-[#876420]">
              <span>Clock-In / Out Policy & Windows</span>
              <span className="text-[10px] bg-[#c29b38]/15 px-2 py-0.5 rounded text-[#876420]">10m Grace</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="p-2 bg-white rounded-lg border border-[#ecdcb7]/70">
                <span className="font-bold text-slate-800 block mb-0.5">🟢 Clock-In Window</span>
                <span>Opens 30m prior to shift. Arrivals up to +10m past shift start are <strong>PRESENT</strong>; beyond is <strong>LATE</strong>.</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#ecdcb7]/70">
                <span className="font-bold text-slate-800 block mb-0.5">🟠 Clock-Out Window</span>
                <span>Active upon shift completion. Records total working hours against scheduled shift.</span>
              </div>
            </div>
          </div>

          {/* Time input area */}
          {isStaff ? (
            <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] space-y-3 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#876420]">
                Live Time Clock
              </div>
              <div className="text-2xl font-black font-mono text-[#1d140d] tracking-widest bg-white py-2 rounded-lg border border-[#ecdcb7]">
                {recordForm.checkInTime || new Date().toTimeString().slice(0, 5)}
              </div>
              <p className="text-[11px] text-slate-500">
                Timestamp is automatically locked to the server/system clock upon punching.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const nowTime = new Date().toTimeString().slice(0, 5);
                    setRecordForm({
                      ...recordForm,
                      includeCheckIn: true,
                      includeCheckOut: false,
                      checkInTime: nowTime,
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    recordForm.includeCheckIn && !recordForm.includeCheckOut
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-slate-700 border-[#ecdcb7] hover:bg-emerald-50'
                  }`}
                >
                  ✓ Punch Check-In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nowTime = new Date().toTimeString().slice(0, 5);
                    setRecordForm({
                      ...recordForm,
                      includeCheckIn: false,
                      includeCheckOut: true,
                      checkOutTime: nowTime,
                    });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    recordForm.includeCheckOut
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-white text-slate-700 border-[#ecdcb7] hover:bg-amber-50'
                  }`}
                >
                  ⏰ Clock Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Manual Punch Time Entry (Management)
              </div>
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
          )}

          {!isStaff && (
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
          )}

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

      {/* Administrative Correction Modal (Admin / Manager Only) */}
      {correctingRecord && (
        <Modal
          isOpen={isCorrectModalOpen}
          onClose={() => setIsCorrectModalOpen(false)}
          title={`Administrative Correction — #${correctingRecord.id}`}
        >
          <form onSubmit={handleCorrectSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="font-bold">⚠️ Audit-Logged Administrative Correction</div>
              <p>
                Modifying record for <strong>{correctingRecord.employee.firstName} {correctingRecord.employee.lastName}</strong> on{' '}
                <strong>{new Date(correctingRecord.date).toLocaleDateString()}</strong>. Your User ID and timestamp will be permanently attached for auditing.
              </p>
            </div>

            <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={correctForm.includeCheckIn}
                    onChange={(e) => setCorrectForm({ ...correctForm, includeCheckIn: e.target.checked })}
                    className="rounded text-[#c29b38] focus:ring-[#c29b38]"
                  />
                  <span>Check-In Timestamp</span>
                </label>
                {correctForm.includeCheckIn && (
                  <input
                    type="time"
                    value={correctForm.checkInTime}
                    onChange={(e) => setCorrectForm({ ...correctForm, checkInTime: e.target.value })}
                    className="px-2.5 py-1 bg-white border border-[#ecdcb7] rounded-lg text-xs font-mono"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={correctForm.includeCheckOut}
                    onChange={(e) => setCorrectForm({ ...correctForm, includeCheckOut: e.target.checked })}
                    className="rounded text-[#c29b38] focus:ring-[#c29b38]"
                  />
                  <span>Check-Out Timestamp</span>
                </label>
                {correctForm.includeCheckOut && (
                  <input
                    type="time"
                    value={correctForm.checkOutTime}
                    onChange={(e) => setCorrectForm({ ...correctForm, checkOutTime: e.target.value })}
                    className="px-2.5 py-1 bg-white border border-[#ecdcb7] rounded-lg text-xs font-mono"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Attendance Status *
              </label>
              <select
                value={correctForm.status}
                onChange={(e) => setCorrectForm({ ...correctForm, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="ABSENT">ABSENT</option>
                <option value="ON_LEAVE">ON LEAVE</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#ecdcb7]/60">
              <button
                type="button"
                onClick={() => setIsCorrectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
              >
                Save Correction & Audit Log
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
