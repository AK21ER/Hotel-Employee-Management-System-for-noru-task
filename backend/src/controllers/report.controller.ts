import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';

export class ReportController {
  /**
   * GET /api/reports/attendance-rate?department=&month=YYYY-MM
   */
  static async getAttendanceRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { department, month } = req.query;
      const result = await ReportService.getAttendanceRateReport(
        {
          departmentId: department ? Number(department) : undefined,
          month: month ? String(month) : undefined,
        },
        req.user
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/absenteeism?from=&to=&limit=10&search=
   */
  static async getAbsenteeism(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, from, to, limit } = req.query;
      const result = await ReportService.getAbsenteeismReport(
        {
          search: search ? String(search) : undefined,
          from: from ? String(from) : undefined,
          to: to ? String(to) : undefined,
          limit: limit ? Number(limit) : 10,
        },
        req.user
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/roster?date=YYYY-MM-DD&search=
   */
  static async getRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, search } = req.query;
      const result = await ReportService.getRosterReport(
        date ? String(date) : undefined,
        search ? String(search) : undefined,
        req.user
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
