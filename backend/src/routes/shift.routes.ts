import { Router } from 'express';
import { ShiftController, createShiftSchema, updateShiftSchema } from '../controllers/shift.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Hotel shift management
 */

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: Retrieve list of shifts
 *     tags: [Shifts]
 *     parameters:
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
 *         description: List of shifts
 */
router.get('/', ShiftController.getAll);

/**
 * @swagger
 * /api/shifts:
 *   post:
 *     summary: Create a shift
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 example: "07:00"
 *               endTime:
 *                 type: string
 *                 example: "15:00"
 *     responses:
 *       201:
 *         description: Shift created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  requireRole('ADMIN'),
  validateRequest({ body: createShiftSchema }),
  ShiftController.create
);

/**
 * @swagger
 * /api/shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shift details
 *       404:
 *         description: Shift not found
 */
router.get('/:id', ShiftController.getById);

/**
 * @swagger
 * /api/shifts/{id}:
 *   put:
 *     summary: Update shift
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift updated
 *       404:
 *         description: Shift not found
 */
router.put(
  '/:id',
  requireRole('ADMIN'),
  validateRequest({ body: updateShiftSchema }),
  ShiftController.update
);

/**
 * @swagger
 * /api/shifts/{id}:
 *   delete:
 *     summary: Delete shift
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shift deleted
 *       404:
 *         description: Shift not found
 */
router.delete('/:id', requireRole('ADMIN'), ShiftController.delete);

export default router;
