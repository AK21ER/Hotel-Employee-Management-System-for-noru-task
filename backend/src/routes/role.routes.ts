import { Router } from 'express';
import { RoleController, createRoleSchema, updateRoleSchema } from '../controllers/role.controller.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Retrieve list of roles
 *     tags: [Roles]
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
 *         description: List of roles
 */
router.get('/', RoleController.getAll);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created
 *       409:
 *         description: Role title already exists
 */
router.post('/', validateRequest({ body: createRoleSchema }), RoleController.create);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role details
 *       404:
 *         description: Role not found
 */
router.get('/:id', RoleController.getById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Role not found
 */
router.put('/:id', validateRequest({ body: updateRoleSchema }), RoleController.update);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 */
router.delete('/:id', RoleController.delete);

export default router;
