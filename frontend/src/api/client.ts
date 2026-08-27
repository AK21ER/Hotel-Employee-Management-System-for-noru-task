const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  _count?: { employees: number };
}

export interface Role {
  id: number;
  title: string;
  description: string | null;
  _count?: { employees: number };
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  _count?: { assignments: number };
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  departmentId: number;
  department: Department;
  roleId: number;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  id: number;
  employeeId: number;
  employee: Employee;
  shiftId: number;
  shift: Shift;
  date: string;
  attendance?: Attendance | null;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employee: Employee;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';
  checkIn: string | null;
  checkOut: string | null;
  shiftAssignmentId: number | null;
  shiftAssignment?: {
    shift: Shift;
  } | null;
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  mustChangePassword: boolean;
  employeeId?: number | null;
  departmentId?: number | null;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    departmentId: number;
    roleId: number;
    department: { id: number; name: string };
    role: { id: number; title: string };
  } | null;
}

export interface AttendanceRateReportItem {
  departmentId: number;
  departmentName: string;
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  onLeaveCount: number;
  activeEmployees: number;
  expectedWorkingDays: number;
  attendanceRate: number;
  onTimeRate: number;
}

export interface AbsenteeismReportItem {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  absentCount: number;
  lateCount: number;
  totalInfractions: number;
}

export interface DailyRosterShift {
  shiftName: string;
  totalEmployees: number;
  employees: Array<{
    assignmentId: number;
    employeeId: number;
    employeeName: string;
    email: string;
    role: string;
    attendanceStatus: string;
    checkIn: string | null;
    checkOut: string | null;
  }>;
}

export interface DailyRosterDepartment {
  departmentName: string;
  shifts: DailyRosterShift[];
}

export interface DailyRosterReport {
  date: string;
  totalAssignments: number;
  departments: DailyRosterDepartment[];
}

import { toast } from '../context/ToastContext';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensure cookies are sent and received
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message ||
        data.error ||
        (data.details ? data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ') : 'Something went wrong');

      // Do not popup a toast for silent background 401 checks on /auth/me
      if (!(endpoint === '/auth/me' && response.status === 401)) {
        toast.error(errorMessage);
      }

      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
  } catch (err: any) {
    // If it's a network disconnection error or server down
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netError = 'Cannot connect to backend server. Please verify the API is running on port 5000.';
      toast.error(netError, 'Network Connection Failed');
      throw new Error(netError);
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: AuthUser; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),
  getMe: () => request<{ user: AuthUser }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  registerUser: (data: { email: string; password: string; role: 'ADMIN' | 'MANAGER'; employeeId?: number }) =>
    request<{ message: string; data: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Employees
  getEmployees: (params?: { search?: string; departmentId?: number; roleId?: number; status?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.departmentId) query.append('departmentId', String(params.departmentId));
    if (params?.roleId) query.append('roleId', String(params.roleId));
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<Employee[]>>(`/employees?${query.toString()}`);
  },
  getEmployeeById: (id: number) => request<{ data: Employee }>(`/employees/${id}`),
  createEmployee: (data: Partial<Employee>) =>
    request<{ message: string; data: Employee; tempPassword?: string }>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: number, data: Partial<Employee>) =>
    request<{ message: string; data: Employee }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: number) =>
    request<{ message: string; data: Employee }>(`/employees/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  getDepartments: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<Department[]>>(`/departments?${query.toString()}`);
  },
  createDepartment: (data: { name: string; description?: string }) =>
    request<{ message: string; data: Department }>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDepartment: (id: number, data: { name?: string; description?: string }) =>
    request<{ message: string; data: Department }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id: number) =>
    request<{ message: string }>(`/departments/${id}`, {
      method: 'DELETE',
    }),

  // Roles
  getRoles: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<Role[]>>(`/roles?${query.toString()}`);
  },
  createRole: (data: { title: string; description?: string }) =>
    request<{ message: string; data: Role }>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRole: (id: number, data: { title?: string; description?: string }) =>
    request<{ message: string; data: Role }>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRole: (id: number) =>
    request<{ message: string }>(`/roles/${id}`, {
      method: 'DELETE',
    }),

  // Shifts
  getShifts: (params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<Shift[]>>(`/shifts?${query.toString()}`);
  },
  createShift: (data: { name: string; startTime: string; endTime: string }) =>
    request<{ message: string; data: Shift }>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateShift: (id: number, data: Partial<Shift>) =>
    request<{ message: string; data: Shift }>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteShift: (id: number) =>
    request<{ message: string }>(`/shifts/${id}`, {
      method: 'DELETE',
    }),

  // Shift Assignments
  getShiftAssignments: (params?: { search?: string; date?: string; employeeId?: number; departmentId?: number; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.date) query.append('date', params.date);
    if (params?.employeeId) query.append('employeeId', String(params.employeeId));
    if (params?.departmentId) query.append('departmentId', String(params.departmentId));
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<ShiftAssignment[]>>(`/shift-assignments?${query.toString()}`);
  },
  createShiftAssignment: (data: { employeeId: number; shiftId: number; date: string }) =>
    request<{ message: string; data: ShiftAssignment }>('/shift-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteShiftAssignment: (id: number) =>
    request<{ message: string }>(`/shift-assignments/${id}`, {
      method: 'DELETE',
    }),

  // Attendance
  getAttendance: (params?: { search?: string; employeeId?: number; departmentId?: number; from?: string; to?: string; status?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.employeeId) query.append('employeeId', String(params.employeeId));
    if (params?.departmentId) query.append('departmentId', String(params.departmentId));
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    return request<ApiResponse<Attendance[]>>(`/attendance?${query.toString()}`);
  },
  recordAttendance: (data: {
    employeeId: number;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status?: string | null;
  }) =>
    request<{ message: string; data: Attendance }>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAttendance: (id: number) =>
    request<{ message: string }>(`/attendance/${id}`, {
      method: 'DELETE',
    }),

  // Reports
  getAttendanceRateReport: (params?: { month?: string; department?: number }) => {
    const query = new URLSearchParams();
    if (params?.month) query.append('month', params.month);
    if (params?.department) query.append('department', String(params.department));
    return request<{ period: { month: string; startDate: string; endDate: string }; data: AttendanceRateReportItem[] }>(
      `/reports/attendance-rate?${query.toString()}`
    );
  },
  getAbsenteeismReport: (params?: { search?: string; from?: string; to?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<{ period: { from: string; to: string }; limit: number; data: AbsenteeismReportItem[] }>(
      `/reports/absenteeism?${query.toString()}`
    );
  },
  getRosterReport: (params?: { date?: string; search?: string } | string) => {
    const query = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) query.append('date', params);
    } else if (params) {
      if (params.date) query.append('date', params.date);
      if (params.search) query.append('search', params.search);
    }
    return request<DailyRosterReport>(`/reports/roster?${query.toString()}`);
  },
};
