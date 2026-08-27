import prisma from '../lib/prisma.js';
import { toDateOnly } from '../lib/date.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthUserPayload } from '../lib/auth.js';

export class ReportService {
  /**
   * Flagship non-trivial query:
   * Calculates monthly per-department attendance rate (% present vs scheduled/recorded).
   * Aggregates Attendance records joined with Employee and Department using Prisma.
   */
  static async getAttendanceRateReport(
    params: { month?: string; departmentId?: number },
    actor?: AuthUserPayload
  ) {
    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members do not have access to analytical reports', 403);
    }

    // Force department filter for MANAGER
    const effectiveDepartmentId =
      actor?.role === 'MANAGER' ? actor.departmentId || -1 : params.departmentId ? Number(params.departmentId) : undefined;

    // Determine date range for month YYYY-MM
    let startDate: Date;
    let endDate: Date;

    if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
      const [year, month] = params.month.split('-').map(Number);
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    }

    // Retrieve departments (with filtered department if provided)
    const departments = await prisma.department.findMany({
      where: effectiveDepartmentId ? { id: effectiveDepartmentId } : undefined,
      include: {
        employees: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Fetch attendance records for the date range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        employee: {
          status: 'ACTIVE',
          ...(effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : {}),
        },
      },
      select: {
        id: true,
        status: true,
        employee: {
          select: {
            id: true,
            departmentId: true,
          },
        },
      },
    });

    // Group and aggregate statistics per department
    const departmentStatsMap = new Map<
      number,
      {
        departmentId: number;
        departmentName: string;
        totalRecords: number;
        presentCount: number;
        lateCount: number;
        absentCount: number;
        onLeaveCount: number;
        activeEmployees: number;
      }
    >();

    departments.forEach((dept) => {
      departmentStatsMap.set(dept.id, {
        departmentId: dept.id,
        departmentName: dept.name,
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        onLeaveCount: 0,
        activeEmployees: dept.employees.length,
      });
    });

    attendanceRecords.forEach((record) => {
      const deptId = record.employee.departmentId;
      const stats = departmentStatsMap.get(deptId);
      if (!stats) return;

      stats.totalRecords += 1;
      if (record.status === 'PRESENT') stats.presentCount += 1;
      else if (record.status === 'LATE') stats.lateCount += 1;
      else if (record.status === 'ABSENT') stats.absentCount += 1;
      else if (record.status === 'ON_LEAVE') stats.onLeaveCount += 1;
    });

    const results = Array.from(departmentStatsMap.values()).map((stats) => {
      const expectedWorkingDays = stats.totalRecords - stats.onLeaveCount;
      const onDuty = stats.presentCount + stats.lateCount;
      const attendanceRate =
        expectedWorkingDays > 0 ? Number(((onDuty / expectedWorkingDays) * 100).toFixed(2)) : 100.0;
      const onTimeRate =
        expectedWorkingDays > 0 ? Number(((stats.presentCount / expectedWorkingDays) * 100).toFixed(2)) : 100.0;

      return {
        ...stats,
        expectedWorkingDays,
        attendanceRate, // % on duty (present + late)
        onTimeRate,     // % on time (present without late)
      };
    });

    return {
      period: {
        month: params.month || `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      data: results,
    };
  }

  /**
   * Absenteeism report:
   * Ranked employees by count of ABSENT + LATE records in date range descending.
   * Explicitly excludes ON_LEAVE since planned leaves are not infractions.
   * Scoped to MANAGER's department if actor is a manager.
   */
  static async getAbsenteeismReport(
    params: { from?: string; to?: string; limit?: number; search?: string },
    actor?: AuthUserPayload
  ) {
    if (actor?.role === 'STAFF') {
      throw new AppError('Staff members do not have access to analytical reports', 403);
    }

    const limit = Math.max(1, Math.min(100, params.limit || 10));

    let startDate: Date;
    let endDate: Date;

    if (params.from) {
      startDate = toDateOnly(params.from);
    } else {
      // Default to last 30 days
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = toDateOnly(d);
    }

    if (params.to) {
      endDate = toDateOnly(params.to);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
    }

    const employeeFilter: any = {
      status: 'ACTIVE',
    };

    if (actor?.role === 'MANAGER') {
      employeeFilter.departmentId = actor.departmentId || -1;
    }

    if (params.search && params.search.trim()) {
      const query = params.search.trim();
      employeeFilter.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Find all attendance records with ABSENT or LATE only in the range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['ABSENT', 'LATE'], // Excludes ON_LEAVE
        },
        employee: employeeFilter,
      },
      select: {
        id: true,
        status: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { name: true },
            },
            role: {
              select: { title: true },
            },
          },
        },
      },
    });

    const employeeMap = new Map<
      number,
      {
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
    >();

    attendanceRecords.forEach((rec) => {
      const emp = rec.employee;
      let entry = employeeMap.get(emp.id);
      if (!entry) {
        entry = {
          employeeId: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          department: emp.department.name,
          role: emp.role.title,
          absentCount: 0,
          lateCount: 0,
          totalInfractions: 0,
        };
        employeeMap.set(emp.id, entry);
      }

      if (rec.status === 'ABSENT') entry.absentCount += 1;
      if (rec.status === 'LATE') entry.lateCount += 1;
      entry.totalInfractions += 1;
    });

    const ranked = Array.from(employeeMap.values())
      .sort((a, b) => b.totalInfractions - a.totalInfractions || b.absentCount - a.absentCount)
      .slice(0, limit);

    return {
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      limit,
      data: ranked,
    };
  }

  /**
   * Daily Roster report:
   * All ShiftAssignments for a given date, grouped by Department then Shift.
   * Scoped to MANAGER's department if actor is a manager.
   */
  static async getRosterReport(dateStr?: string, search?: string, actor?: AuthUserPayload) {
    const targetDate = dateStr ? toDateOnly(dateStr) : toDateOnly(new Date());

    const where: any = {
      date: targetDate,
    };

    if (actor?.role === 'STAFF') {
      where.employeeId = actor.employeeId || -1;
    } else if (actor?.role === 'MANAGER') {
      where.employee = {
        departmentId: actor.departmentId || -1,
      };
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.employee = {
        ...(where.employee || {}),
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where,
      select: {
        id: true,
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
            role: {
              select: {
                title: true,
              },
            },
          },
        },
        attendance: {
          select: {
            status: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: [
        { employee: { department: { name: 'asc' } } },
        { shift: { startTime: 'asc' } },
        { employee: { lastName: 'asc' } },
      ],
    });

    // Group by department then by shift
    const departmentMap = new Map<string, Map<string, any[]>>();

    assignments.forEach((assignment) => {
      const deptName = assignment.employee.department.name;
      const shiftName = `${assignment.shift.name} (${assignment.shift.startTime} - ${assignment.shift.endTime})`;

      if (!departmentMap.has(deptName)) {
        departmentMap.set(deptName, new Map<string, any[]>());
      }
      const shiftMap = departmentMap.get(deptName)!;

      if (!shiftMap.has(shiftName)) {
        shiftMap.set(shiftName, []);
      }

      shiftMap.get(shiftName)!.push({
        assignmentId: assignment.id,
        employeeId: assignment.employee.id,
        employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        email: assignment.employee.email,
        role: assignment.employee.role.title,
        attendanceStatus: assignment.attendance?.status ?? 'NOT_RECORDED',
        checkIn: assignment.attendance?.checkIn ?? null,
        checkOut: assignment.attendance?.checkOut ?? null,
      });
    });

    // Format grouped hierarchy
    const departments = Array.from(departmentMap.entries()).map(([departmentName, shiftsMap]) => ({
      departmentName,
      shifts: Array.from(shiftsMap.entries()).map(([shiftName, employees]) => ({
        shiftName,
        totalEmployees: employees.length,
        employees,
      })),
    }));

    return {
      date: targetDate.toISOString().split('T')[0],
      totalAssignments: assignments.length,
      departments,
    };
  }
}
