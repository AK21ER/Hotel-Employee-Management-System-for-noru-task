import { Router } from 'express';
import {
  DepartmentController,
  createDepartmentSchema,
  updateDepartmentSchema,
} from '../controllers/department.controller.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management
 */

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Retrieve list of departments
 *     tags: [Departments]
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
 *         description: List of departments
 */
router.get('/', DepartmentController.getAll);

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 *       409:
 *         description: Department name exists
 */
router.post('/', validateRequest({ body: createDepartmentSchema }), DepartmentController.create);

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department details by ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department details
 *       404:
 *         description: Department not found
 */
router.get('/:id', DepartmentController.getById);

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Departments]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated
 *       404:
 *         description: Department not found
 */
router.put('/:id', validateRequest({ body: updateDepartmentSchema }), DepartmentController.update);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Department deleted
 *       404:
 *         description: Department not found
 */
router.delete('/:id', DepartmentController.delete);

export default router;
