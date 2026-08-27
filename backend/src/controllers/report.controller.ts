import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';

export class ReportController {
  /**
   * GET /api/reports/attendance-rate?department=&month=YYYY-MM
   */
  static async getAttendanceRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { department, month } = req.query;
      const result = await ReportService.getAttendanceRateReport({
        departmentId: department ? Number(department) : undefined,
        month: month ? String(month) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/absenteeism?from=&to=&limit=10
   */
  static async getAbsenteeism(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, limit } = req.query;
      const result = await ReportService.getAbsenteeismReport({
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        limit: limit ? Number(limit) : 10,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/roster?date=YYYY-MM-DD
   */
  static async getRoster(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const result = await ReportService.getRosterReport(date ? String(date) : undefined);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
