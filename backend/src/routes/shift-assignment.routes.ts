import { Router } from 'express';
import {
  ShiftAssignmentController,
  createShiftAssignmentSchema,
} from '../controllers/shift-assignment.controller.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shift Assignments
 *   description: Shift scheduling & employee assignment
 */

/**
 * @swagger
 * /api/shift-assignments:
 *   get:
 *     summary: Get shift assignments with optional filters (date, employeeId, departmentId)
 *     tags: [Shift Assignments]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: "Date filter (YYYY-MM-DD)"
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
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
 *         description: List of shift assignments
 */
router.get('/', ShiftAssignmentController.getAll);

/**
 * @swagger
 * /api/shift-assignments:
 *   post:
 *     summary: Assign a shift to an employee on a calendar day
 *     tags: [Shift Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - shiftId
 *               - date
 *             properties:
 *               employeeId:
 *                 type: integer
 *               shiftId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-26"
 *     responses:
 *       201:
 *         description: Shift assigned
 *       409:
 *         description: Employee already has a shift assigned on this date (DB Unique constraint enforced)
 */
router.post('/', validateRequest({ body: createShiftAssignmentSchema }), ShiftAssignmentController.create);

/**
 * @swagger
 * /api/shift-assignments/{id}:
 *   get:
 *     summary: Get shift assignment by ID
 *     tags: [Shift Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shift assignment details
 *       404:
 *         description: Shift assignment not found
 */
router.get('/:id', ShiftAssignmentController.getById);

/**
 * @swagger
 * /api/shift-assignments/{id}:
 *   delete:
 *     summary: Remove a shift assignment
 *     tags: [Shift Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignment removed
 *       404:
 *         description: Assignment not found
 */
router.delete('/:id', ShiftAssignmentController.delete);

export default router;
