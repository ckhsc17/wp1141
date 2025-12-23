import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import { getUserName, getUserUserId, getAnonymousUserId } from '../lib/userUtils';
import { 
  addMemberSchema, 
  updateMemberLocationSchema, 
  memberParamsSchema,
  createOfflineMemberSchema,
  updateOfflineMemberSchema,
  type AddMemberRequest,
  type UpdateMemberLocationRequest,
  type MemberParams,
  type CreateOfflineMemberRequest,
  type UpdateOfflineMemberRequest
} from '../schemas/members';

const router = Router();

/**
 * @swagger
 * /members:
 *   post:
 *     summary: Add member to group (join group or add another user)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - groupId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID to add (can be current user to join group)
 *               groupId:
 *                 type: integer
 *                 description: Group ID
 *               lat:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude (optional)
 *               lng:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude (optional)
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Address (optional)
 *               travelMode:
 *                 type: string
 *                 enum: [driving, transit, walking, bicycling]
 *                 description: Travel mode (optional)
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   $ref: '#/components/schemas/Member'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Cannot add others if not a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Target user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User is already a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /members - Add member to event (join event or add another user)
router.post('/', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = addMemberSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: validation.error.errors
      });
      return;
    }

    const { username, eventId, lat, lng, address, travelMode } = validation.data as AddMemberRequest;
    
    // Get current user's userId (if authenticated)
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      res.status(404).json({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found'
      });
      return;
    }

    // If user is adding themselves, allow it (joining the event)
    // If user is adding someone else (by userId), check if they're already a member
    if (currentUserUserId && username !== currentUserUserId) {
      const userMembership = await prisma.member.findFirst({
        where: {
          userId: currentUserUserId,
          eventId: eventId
        }
      });

      if (!userMembership) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You are not a member of this event and cannot add others.'
        });
        return;
      }
    }

    // Check if user is already a member (by userId)
    const existingMember = await prisma.member.findFirst({
      where: {
        userId: username,
        eventId: eventId
      }
    });

    if (existingMember) {
      res.status(409).json({
        code: 'MEMBER_EXISTS',
        message: 'User is already a member of this event'
      });
      return;
    }

    // Add the member
    const member = await prisma.member.create({
      data: {
        userId: username,
        eventId: eventId,
        lat,
        lng,
        address,
        travelMode: travelMode || 'driving'
      }
    });

    res.status(201).json({ member });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to add member'
    });
  }
});

/**
 * @swagger
 * /members/{id}:
 *   patch:
 *     summary: Update member location and travel mode (own location only)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude (optional)
 *               lng:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude (optional)
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Address (optional)
 *               travelMode:
 *                 type: string
 *                 enum: [driving, transit, walking, bicycling]
 *                 description: Travel mode (optional)
 *     responses:
 *       200:
 *         description: Member location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   $ref: '#/components/schemas/Member'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Member not found or you can only update your own location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PATCH /members/:id - Update member location (own location only)
router.patch('/:id', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const paramsValidation = memberParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid member ID',
        errors: paramsValidation.error.errors
      });
      return;
    }

    const bodyValidation = updateMemberLocationSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: bodyValidation.error.errors
      });
      return;
    }

    const { id } = paramsValidation.data as MemberParams;
    const { lat, lng, address, travelMode } = bodyValidation.data as UpdateMemberLocationRequest;
    
    // Get current user's name (if authenticated)
    let currentUserName: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserName = await getUserName((req.user as { userId: number }).userId);
    }

    // Check if the member exists
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      res.status(404).json({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found'
      });
      return;
    }

    // Get current user's userId for comparison
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }
    
    // Check if user can update this member (must be the member themselves)
    if (currentUserUserId && member.userId !== currentUserUserId) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only update your own location'
      });
      return;
    }

    // Update the member location and travel mode
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        lat,
        lng,
        address,
        travelMode,
        updatedAt: new Date()
      }
    });

    res.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member location:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update member location'
    });
  }
});

/**
 * @swagger
 * /members/{id}:
 *   delete:
 *     summary: Remove member from group (self or group owner)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or owner cannot leave while other members exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Can only remove yourself or must be group owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /members/:id - Remove member from event (self or event owner)
router.delete('/:id', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = memberParamsSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid member ID',
        errors: validation.error.errors
      });
      return;
    }

    const { id } = validation.data as MemberParams;
    
    // Get current user's name (if authenticated)
    let currentUserName: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserName = await getUserName((req.user as { userId: number }).userId);
    }

    // Find the member and event
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        event: true
      }
    });

    if (!member) {
      res.status(404).json({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found'
      });
      return;
    }

    // Get current user's userId for comparison
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }
    
    // Check if user can remove this member:
    // 1. User is removing themselves (userId matches), OR
    // 2. User is the event owner (ownerId matches)
    const canRemove = (currentUserUserId && member.userId === currentUserUserId) || 
                      (currentUserUserId && member.event.ownerId === currentUserUserId);

    if (!canRemove) {
      res.status(403).json({
        code: 'ACCESS_DENIED',
        message: 'You can only remove yourself or you must be the event owner'
      });
      return;
    }

    // Check if this is the event owner trying to leave their own event
    if (currentUserUserId && member.userId === currentUserUserId && member.event.ownerId === currentUserUserId) {
      // Count other members
      const memberCount = await prisma.member.count({
        where: {
          eventId: member.eventId,
          userId: { not: currentUserUserId }
        }
      });

      if (memberCount > 0) {
        res.status(400).json({
          code: 'OWNER_CANNOT_LEAVE',
          message: 'Event owner cannot leave while other members exist. Transfer ownership or delete the event.'
        });
        return;
      }
    }

    await prisma.member.delete({
      where: { id }
    });

    res.json({
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to remove member'
    });
  }
});

/**
 * @swagger
 * /members/offline:
 *   post:
 *     summary: Create offline member (non-registered user)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - nickname
 *               - lat
 *               - lng
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: Group ID
 *               nickname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Display name for offline member
 *               lat:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude
 *               lng:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Address (optional)
 *               travelMode:
 *                 type: string
 *                 enum: [driving, transit, walking, bicycling]
 *                 default: driving
 *                 description: Travel mode
 *     responses:
 *       201:
 *         description: Offline member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   $ref: '#/components/schemas/Member'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Must be a member of the group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /members/offline - Create offline member
router.post('/offline', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createOfflineMemberSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: validation.error.errors
      });
      return;
    }

    const { eventId, nickname, lat, lng, address, travelMode } = validation.data;
    
    // Get current user's name (if authenticated)
    let currentUserName: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserName = await getUserName((req.user as { userId: number }).userId);
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      res.status(404).json({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found'
      });
      return;
    }

    // Get current user's userId for comparison
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }
    
    // Check if user is a member of this event (if authenticated)
    if (currentUserUserId) {
      const membership = await prisma.member.findFirst({
        where: {
          eventId,
          userId: currentUserUserId
        }
      });

      if (!membership) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You must be a member of this event to add offline members'
        });
        return;
      }
    }

    // Create offline member (no userId, only nickname)
    const offlineMember = await prisma.member.create({
      data: {
        eventId,
        nickname,
        userId: null, // Offline members don't have userId
        lat,
        lng,
        address,
        travelMode
      }
    });

    res.status(201).json({ member: offlineMember });
  } catch (error) {
    console.error('Error creating offline member:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create offline member'
    });
  }
});

/**
 * @swagger
 * /members/offline/{id}:
 *   patch:
 *     summary: Update offline member (group members can edit)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offline member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Display name (optional)
 *               lat:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude (optional)
 *               lng:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude (optional)
 *               address:
 *                 type: string
 *                 maxLength: 255
 *                 description: Address (optional)
 *               travelMode:
 *                 type: string
 *                 enum: [driving, transit, walking, bicycling]
 *                 description: Travel mode (optional)
 *     responses:
 *       200:
 *         description: Offline member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 member:
 *                   $ref: '#/components/schemas/Member'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Must be a member of the group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Offline member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PATCH /members/offline/:id - Update offline member
router.patch('/offline/:id', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const memberIdValidation = memberParamsSchema.safeParse(req.params);
    if (!memberIdValidation.success) {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid member ID',
        errors: memberIdValidation.error.errors
      });
      return;
    }

    const bodyValidation = updateOfflineMemberSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: bodyValidation.error.errors
      });
      return;
    }

    const { id } = memberIdValidation.data;
    
    // Get current user's userId (if authenticated)
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }

    // Check if this is an offline member (offline members have userId === null)
    const member = await prisma.member.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!member || member.userId !== null) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Offline member not found'
      });
      return;
    }

    // Check if user is a member of the same event (if authenticated)
    if (currentUserUserId) {
      const userMembership = await prisma.member.findFirst({
        where: {
          eventId: member.eventId,
          userId: currentUserUserId
        }
      });

      if (!userMembership) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You must be a member of this event to edit offline members'
        });
        return;
      }
    }

    // Update offline member
    const updatedMember = await prisma.member.update({
      where: { id },
      data: bodyValidation.data
    });

    res.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating offline member:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update offline member'
    });
  }
});

/**
 * @swagger
 * /members/offline/{id}:
 *   delete:
 *     summary: Delete offline member (group members can delete)
 *     tags: [Members]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offline member ID
 *     responses:
 *       200:
 *         description: Offline member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Must be a member of the group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Offline member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /members/offline/:id - Delete offline member
router.delete('/offline/:id', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = memberParamsSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(422).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid member ID',
        errors: validation.error.errors
      });
      return;
    }

    const { id } = validation.data;
    
    // Get current user's userId (if authenticated)
    let currentUserUserId: string | null = null;
    if (req.user && 'userId' in req.user) {
      currentUserUserId = await getUserUserId((req.user as { userId: number }).userId);
    }

    // Check if this is an offline member (offline members have userId === null)
    const member = await prisma.member.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!member || member.userId !== null) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Offline member not found'
      });
      return;
    }

    // Check if user is a member of the same event (if authenticated)
    if (currentUserUserId) {
      const userMembership = await prisma.member.findFirst({
        where: {
          eventId: member.eventId,
          userId: currentUserUserId
        }
      });

      if (!userMembership) {
        res.status(403).json({
          code: 'FORBIDDEN',
          message: 'You must be a member of this event to delete offline members'
        });
        return;
      }
    }

    // Delete offline member
    await prisma.member.delete({
      where: { id }
    });

    res.json({ message: 'Offline member deleted successfully' });
  } catch (error) {
    console.error('Error deleting offline member:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete offline member'
    });
  }
});

export default router;
