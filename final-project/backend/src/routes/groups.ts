import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserUserId } from '../lib/userUtils';
import prisma from '../lib/prisma';
import { groupRepository } from '../repositories/GroupRepository';
import {
  groupIdSchema,
  createGroupSchema,
  updateGroupSchema,
  type GroupIdParams,
  type CreateGroupRequest,
  type UpdateGroupRequest,
} from '../schemas/groups';

const router = Router();

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups for current user
 *     tags: [Groups]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userUserId = await getUserUserId(jwtPayload.userId);

    if (!userUserId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const groups = await groupRepository.findByUserId(userUserId);
    res.json({ groups });
  } catch (error: any) {
    console.error('[Groups] Error fetching groups:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch groups',
    });
  }
});

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - cookieAuth: []
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
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userUserId = await getUserUserId(jwtPayload.userId);

    if (!userUserId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const validation = createGroupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: validation.error.errors[0].message,
        errors: validation.error.errors,
      });
      return;
    }

    const data = validation.data as CreateGroupRequest;

    // Create group with current user as owner and first member
    const group = await groupRepository.create({
      name: data.name,
      ownerId: userUserId,
    });

    // Add owner as member
    const owner = await prisma.user.findUnique({
      where: { userId: userUserId },
      select: { id: true },
    });

    if (owner) {
      await prisma.group.update({
        where: { id: group.id },
        data: {
          members: {
            connect: { id: owner.id },
          },
        },
      });
    }

    // Fetch updated group with members
    const updatedGroup = await groupRepository.findById(group.id);
    res.status(201).json({ group: updatedGroup });
  } catch (error: any) {
    console.error('[Groups] Error creating group:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create group',
    });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get group details with members
 *     tags: [Groups]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Invalid group ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not a member of this group
 *       404:
 *         description: Group not found
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userUserId = await getUserUserId(jwtPayload.userId);

    if (!userUserId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const validation = groupIdSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid group ID',
        errors: validation.error.errors,
      });
      return;
    }

    const { id } = validation.data as GroupIdParams;

    const group = await groupRepository.findById(id);

    if (!group) {
      res.status(404).json({
        code: 'GROUP_NOT_FOUND',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is a member of the group
    const isMember = await groupRepository.isMember(id, userUserId);
    if (!isMember) {
      res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'You are not a member of this group',
      });
      return;
    }

    res.json({ group });
  } catch (error: any) {
    console.error('[Groups] Error fetching group:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch group',
    });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   patch:
 *     summary: Update group name (owner only)
 *     tags: [Groups]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
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
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only owner can update group
 *       404:
 *         description: Group not found
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userUserId = await getUserUserId(jwtPayload.userId);

    if (!userUserId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const paramsValidation = groupIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid group ID',
        errors: paramsValidation.error.errors,
      });
      return;
    }

    const bodyValidation = updateGroupSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: bodyValidation.error.errors[0].message,
        errors: bodyValidation.error.errors,
      });
      return;
    }

    const { id } = paramsValidation.data as GroupIdParams;
    const data = bodyValidation.data as UpdateGroupRequest;

    // Check if group exists
    const group = await groupRepository.findById(id);
    if (!group) {
      res.status(404).json({
        code: 'GROUP_NOT_FOUND',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is the owner
    const isOwner = await groupRepository.isOwner(id, userUserId);
    if (!isOwner) {
      res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'Only the group owner can update the group',
      });
      return;
    }

    const updatedGroup = await groupRepository.update(id, data);
    res.json({ group: updatedGroup });
  } catch (error: any) {
    console.error('[Groups] Error updating group:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update group',
    });
  }
});

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group (owner only)
 *     tags: [Groups]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only owner can delete group
 *       404:
 *         description: Group not found
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userUserId = await getUserUserId(jwtPayload.userId);

    if (!userUserId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
      return;
    }

    const validation = groupIdSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid group ID',
        errors: validation.error.errors,
      });
      return;
    }

    const { id } = validation.data as GroupIdParams;

    // Check if group exists
    const group = await groupRepository.findById(id);
    if (!group) {
      res.status(404).json({
        code: 'GROUP_NOT_FOUND',
        message: 'Group not found',
      });
      return;
    }

    // Check if user is the owner
    const isOwner = await groupRepository.isOwner(id, userUserId);
    if (!isOwner) {
      res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'Only the group owner can delete the group',
      });
      return;
    }

    await groupRepository.delete(id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('[Groups] Error deleting group:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete group',
    });
  }
});

export default router;

