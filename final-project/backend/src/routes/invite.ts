import { Router, Request, Response } from 'express';
import { shareTokenService } from '../services/ShareTokenService';
import { z } from 'zod';

const router = Router();

// Schema for invite token parameter
const inviteTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * @swagger
 * /invite/{token}:
 *   get:
 *     summary: Resolve invite token to event ID (public endpoint)
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Share token
 *     responses:
 *       200:
 *         description: Event ID resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eventId:
 *                   type: integer
 *                   description: Event ID corresponding to the token
 *       400:
 *         description: Invalid token format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /invite/:token - Resolve token to event ID (public endpoint)
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = inviteTokenSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid token format',
        errors: validation.error.errors,
      });
      return;
    }

    const { token } = validation.data;

    // Resolve token to event ID
    const eventId = await shareTokenService.getEventIdByToken(token);

    if (!eventId) {
      res.status(404).json({
        code: 'TOKEN_NOT_FOUND',
        message: 'Invalid or expired invite token',
      });
      return;
    }

    res.json({ eventId });
  } catch (error) {
    console.error('Error resolving invite token:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to resolve invite token',
    });
  }
});

export default router;

