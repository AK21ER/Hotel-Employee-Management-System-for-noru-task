import React, { useState, useEffect } from 'react';
import {
  api,
  AttendanceRateReportItem,
  AbsenteeismReportItem,
  DailyRosterReport,
  Department,
} from '../api/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  CalendarDays,
  Building2,
  Calendar,
  Sparkles,
  AlertTriangle,
  User,
  Clock,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<'rate' | 'absenteeism' | 'roster'>('rate');
  const [departments, setDepartments] = useState<Department[]>([]);

  // 1. Attendance Rate State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDept, setSelectedDept] = useState<number | undefined>();
  const [rateData, setRateData] = useState<AttendanceRateReportItem[]>([]);
  const [loadingRate, setLoadingRate] = useState(false);

  // 2. Absenteeism State
  const [absenteeismSearch, setAbsenteeismSearch] = useState('');
  const [absenteeismFrom, setAbsenteeismFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [absenteeismTo, setAbsenteeismTo] = useState(new Date().toISOString().split('T')[0]);
  const [absenteeismLimit, setAbsenteeismLimit] = useState(10);
  const [absenteeismData, setAbsenteeismData] = useState<AbsenteeismReportItem[]>([]);
  const [loadingAbsenteeism, setLoadingAbsenteeism] = useState(false);

  // 3. Daily Roster State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDate, setRosterDate] = useState(new Date().toISOString().split('T')[0]);
  const [rosterData, setRosterData] = useState<DailyRosterReport | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    api.getDepartments().then((res) => setDepartments(res.data || [])).catch(console.error);
  }, []);

  // Fetch Attendance Rate Report
  const fetchRateReport = async () => {
    try {
      setLoadingRate(true);
      const res = await api.getAttendanceRateReport({
        month: selectedMonth,
        department: selectedDept,
      });
      setRateData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRate(false);
    }
  };

  // Fetch Absenteeism Report
  const fetchAbsenteeismReport = async () => {
    try {
      setLoadingAbsenteeism(true);
      const res = await api.getAbsenteeismReport({
        search: absenteeismSearch.trim() || undefined,
        from: absenteeismFrom,
        to: absenteeismTo,
        limit: absenteeismLimit,
      });
      setAbsenteeismData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAbsenteeism(false);
    }
  };

  // Fetch Roster Report
  const fetchRosterReport = async () => {
    try {
      setLoadingRoster(true);
      const res = await api.getRosterReport({
        date: rosterDate,
        search: rosterSearch.trim() || undefined,
      });
      setRosterData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeReportTab === 'rate') fetchRateReport();
    if (activeReportTab === 'absenteeism') fetchAbsenteeismReport();
    if (activeReportTab === 'roster') fetchRosterReport();
  }, [
    activeReportTab,
    selectedMonth,
    selectedDept,
    absenteeismSearch,
    absenteeismFrom,
    absenteeismTo,
    absenteeismLimit,
    rosterDate,
    rosterSearch,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#ecdcb7]/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c29b38]"></span>
            <h1 className="text-2xl font-extrabold text-[#1d140d] tracking-tight">
              Hotel Analytics & Reports
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Data aggregation and operational insights across shifts, staff attendance, and departments.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#ecdcb7] pb-2">
        <button
          onClick={() => setActiveReportTab('rate')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeReportTab === 'rate'
              ? 'bg-gradient-to-r from-[#c29b38] to-[#a9822a] text-white shadow-md shadow-[#c29b38]/20'
              : 'bg-white text-slate-600 border border-[#ecdcb7] hover:bg-[#faf6ee]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Department Attendance Rate</span>
        </button>

        <button
          onClick={() => setActiveReportTab('absenteeism')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeReportTab === 'absenteeism'
              ? 'bg-gradient-to-r from-[#c29b38] to-[#a9822a] text-white shadow-md shadow-[#c29b38]/20'
              : 'bg-white text-slate-600 border border-[#ecdcb7] hover:bg-[#faf6ee]'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Absenteeism & Tardiness Ranking</span>
        </button>

        <button
          onClick={() => setActiveReportTab('roster')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeReportTab === 'roster'
              ? 'bg-gradient-to-r from-[#c29b38] to-[#a9822a] text-white shadow-md shadow-[#c29b38]/20'
              : 'bg-white text-slate-600 border border-[#ecdcb7] hover:bg-[#faf6ee]'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Operations Roster</span>
        </button>
      </div>

      {/* 1. ATTENDANCE RATE REPORT */}
      {activeReportTab === 'rate' && (
        <div className="space-y-6">
          {/* Query explanation callout */}
          <div className="bg-gradient-to-r from-[#1d140d] via-[#2a1d12] to-[#1d140d] border border-[#c29b38]/40 p-4 rounded-2xl flex items-start space-x-3.5 text-xs text-[#e3cfa1]">
            <div className="p-2 bg-[#c29b38]/20 border border-[#c29b38]/40 rounded-xl flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#e3cfa1]" />
            </div>
            <div>
              <strong className="block text-sm font-bold text-[#e3cfa1] mb-0.5">Flagship Multi-Table Aggregation Query</strong>
              <p className="text-[#e3cfa1]/90 leading-relaxed">
                Calculates monthly percentage of attendance (<code className="bg-white/10 px-1 py-0.5 rounded font-mono text-white">Present + Late</code> out of expected working days) by joining <span className="font-semibold text-white">Attendance $\to$ Employee $\to$ Department</span> and grouping records across active personnel.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Filter Department</label>
              <select
                value={selectedDept || ''}
                onChange={(e) => setSelectedDept(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl border border-[#ecdcb7]/80 shadow-sm">
            <h3 className="text-base font-bold text-[#1d140d] mb-4">
              Department Attendance & On-Time Rates ({selectedMonth})
            </h3>
            {loadingRate ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : rateData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">No attendance data for this period.</div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rateData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e5cb" />
                    <XAxis dataKey="departmentName" stroke="#876420" fontSize={12} tickLine={false} />
                    <YAxis unit="%" domain={[0, 100]} stroke="#876420" fontSize={12} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, '']}
                      contentStyle={{ backgroundColor: '#1d140d', borderColor: '#c29b38', borderRadius: '0.75rem', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="attendanceRate" name="Overall Attendance %" fill="#c29b38" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="onTimeRate" name="Punctual On-Time %" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Data Table */}
          <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ecdcb7] bg-[#fcfaf6]">
              <h4 className="text-sm font-bold text-[#876420]">Monthly Aggregation Breakdown</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#fcfaf6] text-xs font-bold text-[#876420] uppercase tracking-wider border-b border-[#ecdcb7]">
                    <th className="py-3 px-6">Department</th>
                    <th className="py-3 px-6 text-center">Active Staff</th>
                    <th className="py-3 px-6 text-center">Present</th>
                    <th className="py-3 px-6 text-center">Late</th>
                    <th className="py-3 px-6 text-center">Absent</th>
                    <th className="py-3 px-6 text-center">On Leave</th>
                    <th className="py-3 px-6 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rateData.map((item) => (
                    <tr key={item.departmentId} className="hover:bg-[#faf6ee]/50">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{item.departmentName}</td>
                      <td className="py-3.5 px-6 text-center text-slate-600">{item.activeEmployees}</td>
                      <td className="py-3.5 px-6 text-center font-mono text-emerald-600 font-semibold">{item.presentCount}</td>
                      <td className="py-3.5 px-6 text-center font-mono text-amber-600 font-semibold">{item.lateCount}</td>
                      <td className="py-3.5 px-6 text-center font-mono text-rose-600 font-semibold">{item.absentCount}</td>
                      <td className="py-3.5 px-6 text-center font-mono text-[#876420] font-semibold">{item.onLeaveCount}</td>
                      <td className="py-3.5 px-6 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          item.attendanceRate >= 90
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.attendanceRate >= 75
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABSENTEEISM REPORT */}
      {activeReportTab === 'absenteeism' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Staff</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter name or email..."
                  value={absenteeismSearch}
                  onChange={(e) => setAbsenteeismSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
              <input
                type="date"
                value={absenteeismFrom}
                onChange={(e) => setAbsenteeismFrom(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
              <input
                type="date"
                value={absenteeismTo}
                onChange={(e) => setAbsenteeismTo(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Top Limit</label>
              <select
                value={absenteeismLimit}
                onChange={(e) => setAbsenteeismLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
              >
                <option value={5}>Top 5 Staff</option>
                <option value={10}>Top 10 Staff</option>
                <option value={20}>Top 20 Staff</option>
              </select>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#ecdcb7] bg-[#fcfaf6] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1d140d]">Absenteeism & Tardiness Leaderboard</h3>
                <p className="text-xs text-slate-500 mt-0.5">Staff ranked by combined count of ABSENT and LATE records descending.</p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Top {absenteeismData.length} Ranked
              </span>
            </div>

            {loadingAbsenteeism ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-slate-500 font-medium">Calculating infractions...</p>
              </div>
            ) : absenteeismData.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Zero absences or tardiness recorded</p>
                <p className="text-xs text-slate-400">All employees were 100% punctual in this date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#fcfaf6] text-xs font-bold text-[#876420] uppercase tracking-wider border-b border-[#ecdcb7]">
                      <th className="py-3.5 px-6">Rank</th>
                      <th className="py-3.5 px-6">Employee</th>
                      <th className="py-3.5 px-6">Department & Role</th>
                      <th className="py-3.5 px-6 text-center">Late Records</th>
                      <th className="py-3.5 px-6 text-center">Absent Records</th>
                      <th className="py-3.5 px-6 text-right">Total Infractions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absenteeismData.map((item, idx) => (
                      <tr key={item.employeeId} className="hover:bg-[#faf6ee]/50 transition">
                        <td className="py-4 px-6 font-bold text-slate-500">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            idx === 0
                              ? 'bg-rose-100 text-rose-700 font-extrabold'
                              : idx === 1
                              ? 'bg-amber-100 text-amber-700 font-extrabold'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-700 font-extrabold'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {item.firstName} {item.lastName}
                          <div className="text-xs text-slate-400 font-normal">{item.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs font-semibold text-slate-700">{item.department}</div>
                          <div className="text-xs text-slate-400">{item.role}</div>
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-semibold text-amber-600">
                          {item.lateCount}
                        </td>
                        <td className="py-4 px-6 text-center font-mono font-semibold text-rose-600">
                          {item.absentCount}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            {item.totalInfractions} incidents
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DAILY ROSTER REPORT */}
      {activeReportTab === 'roster' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#ecdcb7]/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-[#c29b38]" />
              <div className="w-full">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Roster Date</label>
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => setRosterDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Search Staff in Roster</label>
              <div className="relative mt-0.5">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter name or email..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#fdfbf7] border border-[#ecdcb7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c29b38]/30 focus:border-[#c29b38]"
                />
              </div>
            </div>
            {rosterData && (
              <div className="text-xs font-semibold text-[#876420] bg-[#f9f5ea] border border-[#ecdcb7] px-3.5 py-2.5 rounded-xl md:justify-self-end">
                Total Scheduled: <span className="text-[#1d140d] font-bold">{rosterData.totalAssignments} staff</span>
              </div>
            )}
          </div>

          {/* Grouped Roster Hierarchy */}
          {loadingRoster ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-[#c29b38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-500 font-medium">Loading daily roster...</p>
            </div>
          ) : !rosterData || rosterData.departments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ecdcb7]/80 p-16 text-center text-slate-500">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No shift roster scheduled for {rosterDate}</p>
              <p className="text-xs text-slate-400 mt-1">Assign staff in the Shifts tab to build the operations schedule.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {rosterData.departments.map((dept) => (
                <div key={dept.departmentName} className="bg-white rounded-2xl border border-[#ecdcb7]/80 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-[#1b1208] text-white flex items-center justify-between border-b border-[#c29b38]/30">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-[#c29b38]" />
                      <h3 className="font-bold text-base tracking-tight text-white">{dept.departmentName}</h3>
                    </div>
                    <span className="text-xs text-[#e3cfa1] font-bold bg-white/10 px-2.5 py-0.5 rounded-md border border-[#c29b38]/30">
                      {dept.shifts.reduce((acc, s) => acc + s.totalEmployees, 0)} on duty
                    </span>
                  </div>

                  <div className="p-6 space-y-6 divide-y divide-slate-100">
                    {dept.shifts.map((shift, idx) => (
                      <div key={shift.shiftName} className={idx > 0 ? 'pt-6' : ''}>
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="w-4 h-4 text-[#c29b38]" />
                          <h4 className="font-bold text-sm text-[#1d140d]">{shift.shiftName}</h4>
                          <span className="text-xs text-slate-400">({shift.totalEmployees} assigned)</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {shift.employees.map((emp) => (
                            <div
                              key={emp.assignmentId}
                              className="p-3.5 bg-[#fdfbf7] rounded-xl border border-[#ecdcb7] flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-7 h-7 rounded-full bg-[#f9f5ea] text-[#876420] border border-[#ecdcb7] flex items-center justify-center font-bold text-xs">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-800 text-sm block">
                                      {emp.employeeName}
                                    </span>
                                    <span className="text-xs text-slate-400 block">{emp.role}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-[#ecdcb7]/50 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Status:</span>
                                <span className={`font-semibold px-2 py-0.5 rounded ${
                                  emp.attendanceStatus === 'PRESENT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : emp.attendanceStatus === 'LATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : emp.attendanceStatus === 'ABSENT'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {emp.attendanceStatus}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
