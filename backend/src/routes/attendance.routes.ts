import { Router } from 'express';
import {
  AttendanceController,
  recordAttendanceSchema,
} from '../controllers/attendance.controller.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance recording & automatic late-status derivation
 */

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Retrieve attendance records with filters (employeeId, departmentId, from, to, status)
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, LATE, ON_LEAVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance records
 */
router.get('/', AttendanceController.getAll);

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Record employee attendance (evaluates late grace period and auto-derives status)
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - date
 *             properties:
 *               employeeId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-26"
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-26T07:15:00.000Z"
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-26T15:00:00.000Z"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, ON_LEAVE]
 *     responses:
 *       201:
 *         description: Attendance recorded and status derived
 *       400:
 *         description: Validation error
 */
router.post('/', validateRequest({ body: recordAttendanceSchema }), AttendanceController.recordAttendance);

/**
 * @swagger
 * /api/attendance/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance record
 *       404:
 *         description: Not found
 */
router.get('/:id', AttendanceController.getById);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     summary: Delete attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', AttendanceController.delete);

export default router;
