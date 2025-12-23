import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUserUserId } from '../lib/userUtils';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  createInvitationsSchema, 
  invitationIdSchema,
  eventIdSchema,
  type CreateInvitationsRequest,
  type InvitationIdParams,
  type EventIdParams
} from '../schemas/eventInvitations';
import { notificationService } from '../services/NotificationService';
import { triggerEventChannel } from '../lib/pusher';

const router = Router();

/**
 * @swagger
 * /events/{id}/invitations:
 *   post:
 *     summary: Invite friends to an event
 *     tags: [Event Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitedUserIds
 *             properties:
 *               invitedUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Invitations created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not event owner
 *       404:
 *         description: Event not found
 */
// POST /events/:id/invitations - Invite friends to event
router.post('/:id/invitations', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const paramsValidation = eventIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid event ID',
        errors: paramsValidation.error.errors,
      });
      return;
    }

    const bodyValidation = createInvitationsSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        errors: bodyValidation.error.errors,
      });
      return;
    }

    const { id: eventId } = paramsValidation.data as EventIdParams;
    const { invitedUserIds } = bodyValidation.data as CreateInvitationsRequest;

    const jwtPayload = req.user as { userId: number };
    const currentUserUserId = await getUserUserId(jwtPayload.userId);

    if (!currentUserUserId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Get event and check ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        groupId: true,
      },
    });

    if (!event) {
      res.status(404).json({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
      return;
    }

    if (event.ownerId !== currentUserUserId) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Only event owner can invite friends',
      });
      return;
    }

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { userId: currentUserUserId },
      select: { name: true, userId: true },
    });

    if (!inviter) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Create invitations and send notifications
    const createdInvitations = [];
    const errors = [];

    for (const toUserId of invitedUserIds) {
      try {
        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { userId: toUserId },
        });

        if (!targetUser) {
          errors.push({ userId: toUserId, error: 'User not found' });
          continue;
        }

        // Check if already invited
        const existingInvitation = await prisma.eventInvitation.findUnique({
          where: {
            eventId_toUserId: {
              eventId,
              toUserId,
            },
          },
        });

        if (existingInvitation) {
          errors.push({ userId: toUserId, error: 'Already invited' });
          continue;
        }

        // Create invitation
        const invitation = await prisma.eventInvitation.create({
          data: {
            eventId,
            fromUserId: currentUserUserId,
            toUserId,
          },
        });

        createdInvitations.push(invitation);

        // Create notification
        await notificationService.createNotification({
          userId: toUserId,
          type: 'EVENT_INVITE',
          title: '活動邀請',
          body: `${inviter.name} 邀請你參加活動「${event.name}」`,
          data: {
            eventId: event.id,
            eventName: event.name,
            invitationId: invitation.id,
            fromUserId: inviter.userId,
            fromUserName: inviter.name,
          },
          sendPush: true,
        });
      } catch (error) {
        console.error(`Error inviting user ${toUserId}:`, error);
        errors.push({ userId: toUserId, error: 'Failed to create invitation' });
      }
    }

    res.status(201).json({
      invitations: createdInvitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error creating invitations:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create invitations',
    });
  }
});

/**
 * @swagger
 * /events/{id}/invitations/{invitationId}/accept:
 *   post:
 *     summary: Accept event invitation
 *     tags: [Event Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not invitation recipient
 *       404:
 *         description: Invitation not found
 */
// POST /events/:id/invitations/:invitationId/accept - Accept event invitation
router.post('/:id/invitations/:invitationId/accept', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const eventValidation = eventIdSchema.safeParse(req.params);
    const invitationValidation = invitationIdSchema.safeParse(req.params);

    if (!eventValidation.success || !invitationValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters',
      });
      return;
    }

    const { id: eventId } = eventValidation.data as EventIdParams;
    const { invitationId } = invitationValidation.data as InvitationIdParams;

    const jwtPayload = req.user as { userId: number };
    const currentUserUserId = await getUserUserId(jwtPayload.userId);

    if (!currentUserUserId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Get invitation
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            groupId: true,
          },
        },
      },
    });

    if (!invitation) {
      res.status(404).json({
        code: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found',
      });
      return;
    }

    if (invitation.eventId !== eventId) {
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'Invitation does not belong to this event',
      });
      return;
    }

    if (invitation.toUserId !== currentUserUserId) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You are not the recipient of this invitation',
      });
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'Invitation has already been processed',
      });
      return;
    }

    // Get user's default location
    const user = await prisma.user.findUnique({
      where: { userId: currentUserUserId },
      select: {
        name: true,
        defaultLat: true,
        defaultLng: true,
        defaultAddress: true,
      },
    });

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Start transaction to:
    // 1. Update invitation status
    // 2. Create member record
    // 3. Add user to group if exists
    let memberId: number | null = null;
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.eventInvitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      });

      // Check if user is already a member
      const existingMember = await tx.member.findFirst({
        where: {
          eventId,
          userId: currentUserUserId,
        },
      });

      if (!existingMember) {
        // Create member record with default location
        const newMember = await tx.member.create({
          data: {
            eventId,
            userId: currentUserUserId,
            nickname: user.name,
            lat: user.defaultLat,
            lng: user.defaultLng,
            address: user.defaultAddress,
            shareLocation: true,
            travelMode: 'transit',
          },
        });
        memberId = newMember.id;
      } else {
        memberId = existingMember.id;
      }

      // Add user to group if event has a group
      if (invitation.event.groupId) {
        const groupMembership = await tx.group.findFirst({
          where: {
            id: invitation.event.groupId,
            members: {
              some: {
                userId: currentUserUserId,
              },
            },
          },
        });

        if (!groupMembership) {
          await tx.group.update({
            where: { id: invitation.event.groupId },
            data: {
              members: {
                connect: { userId: currentUserUserId },
              },
            },
          });
        }
      }
    }, {
      timeout: 10000, // Increase timeout to 10 seconds for complex operations
    });

    // Move external service calls outside transaction to avoid timeout
    // These operations don't need to be part of the database transaction
    // Re-fetch member to ensure we have the latest data
    const finalMember = memberId ? await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        nickname: true,
        shareLocation: true,
        travelMode: true,
        createdAt: true,
      },
    }) : null;

    if (finalMember) {
      try {
        // Trigger Pusher event for member joined
        triggerEventChannel(eventId, 'member-joined', {
          memberId: finalMember.id,
          nickname: finalMember.nickname || finalMember.userId || 'Unknown',
          userId: finalMember.userId,
          shareLocation: finalMember.shareLocation,
          travelMode: finalMember.travelMode,
          createdAt: finalMember.createdAt.toISOString(),
        });

        // Notify event owner
        await notificationService.createNotification({
          userId: invitation.event.ownerId,
          type: 'EVENT_UPDATE',
          title: '新成員加入',
          body: `${user.name} 接受了你的邀請，加入活動「${invitation.event.name}」`,
          data: {
            eventId: invitation.event.id,
            eventName: invitation.event.name,
            memberId: finalMember.id,
            memberName: user.name,
          },
          sendPush: true,
        });
      } catch (externalError) {
        // Log error but don't fail the request since database transaction already succeeded
        console.error('Error sending external notifications (Pusher/push):', externalError);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to accept invitation',
    });
  }
});

/**
 * @swagger
 * /events/{id}/invitations/{invitationId}/reject:
 *   post:
 *     summary: Reject event invitation
 *     tags: [Event Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation rejected successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not invitation recipient
 *       404:
 *         description: Invitation not found
 */
// POST /events/:id/invitations/:invitationId/reject - Reject event invitation
router.post('/:id/invitations/:invitationId/reject', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !('userId' in req.user)) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    const eventValidation = eventIdSchema.safeParse(req.params);
    const invitationValidation = invitationIdSchema.safeParse(req.params);

    if (!eventValidation.success || !invitationValidation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters',
      });
      return;
    }

    const { id: eventId } = eventValidation.data as EventIdParams;
    const { invitationId } = invitationValidation.data as InvitationIdParams;

    const jwtPayload = req.user as { userId: number };
    const currentUserUserId = await getUserUserId(jwtPayload.userId);

    if (!currentUserUserId) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
      return;
    }

    // Get invitation
    const invitation = await prisma.eventInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      res.status(404).json({
        code: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found',
      });
      return;
    }

    if (invitation.eventId !== eventId) {
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'Invitation does not belong to this event',
      });
      return;
    }

    if (invitation.toUserId !== currentUserUserId) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You are not the recipient of this invitation',
      });
      return;
    }

    if (invitation.status !== 'pending') {
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'Invitation has already been processed',
      });
      return;
    }

    // Update invitation status
    await prisma.eventInvitation.update({
      where: { id: invitationId },
      data: { status: 'rejected' },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to reject invitation',
    });
  }
});

export default router;

