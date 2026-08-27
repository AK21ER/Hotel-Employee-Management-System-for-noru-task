import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Non-trivial reporting & analytical aggregation queries
 */

/**
 * @swagger
 * /api/reports/attendance-rate:
 *   get:
 *     summary: Flagship query - Monthly per-department attendance rate
 *     description: Computes attendance rate (% on duty) for active employees per department by joining Attendance -> Employee -> Department and grouping records.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2026-08"
 *         description: Month in YYYY-MM format
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *         description: Optional Department ID filter
 *     responses:
 *       200:
 *         description: Aggregated monthly department attendance statistics
 */
router.get('/attendance-rate', ReportController.getAttendanceRate);

/**
 * @swagger
 * /api/reports/absenteeism:
 *   get:
 *     summary: Employees ranked by count of ABSENT + LATE records
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Ranked list of employees with highest absence and tardiness infractions
 */
router.get('/absenteeism', ReportController.getAbsenteeism);

/**
 * @swagger
 * /api/reports/roster:
 *   get:
 *     summary: Daily shift roster grouped by Department and Shift
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-08-26"
 *     responses:
 *       200:
 *         description: Grouped shift schedule and real-time attendance status
 */
router.get('/roster', ReportController.getRoster);

export default router;
