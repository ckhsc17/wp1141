import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { notificationService } from '../services/NotificationService';
import { eventService } from '../services/EventService';

const router = Router();

/**
 * Cron job endpoint for checking and sending event reminders
 * This endpoint is called by Vercel Cron Jobs every minute
 * 
 * Security: Vercel automatically adds a secret header that we can verify
 * However, for additional security, we can also check for a custom secret
 */
async function checkEventReminders(req: Request, res: Response): Promise<void> {
  // Verify this is a legitimate cron request
  // Vercel adds a special header, but we can also use a custom secret
  const cronSecret = req.headers['x-vercel-cron-secret'] || req.headers['authorization'];
  const expectedSecret = process.env.CRON_SECRET;
  
  // Only check secret if it's set (optional security measure)
  if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}` && cronSecret !== expectedSecret) {
    console.warn('[CRON] Unauthorized cron request - missing or invalid secret');
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid cron secret' 
    });
    return;
  }

  const startTime = Date.now();
  console.log('[CRON] Event reminders check started at', new Date().toISOString());

  try {
    const now = new Date();
    
    // Update event statuses based on current time (upcoming -> ongoing -> ended)
    try {
      await eventService.updateEventStatuses();
      console.log('[CRON] Event statuses updated');
    } catch (statusError) {
      console.error('[CRON] Error updating event statuses:', statusError);
      // Continue with reminders even if status update fails
    }
    // Calculate the time window: events starting in 30 minutes (±1 minute tolerance)
    const reminderTimeMin = new Date(now.getTime() + 29 * 60 * 1000); // 29 minutes
    const reminderTimeMax = new Date(now.getTime() + 31 * 60 * 1000); // 31 minutes

    // Find upcoming events that start within the reminder window
    const events = await prisma.event.findMany({
      where: {
        status: 'upcoming',
        startTime: {
          gte: reminderTimeMin,
          lte: reminderTimeMax,
        },
      },
      include: {
        members: {
          where: {
            userId: { 
              not: null, // Only registered users
            },
          },
          select: {
            id: true,
            userId: true,
            nickname: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${events.length} events in reminder window`);

    let remindersSent = 0;
    let remindersSkipped = 0;

    // Process each event
    for (const event of events) {
      // Skip if no members
      if (event.members.length === 0) {
        continue;
      }

      // Send reminder to each member
      for (const member of event.members) {
        if (!member.userId) {
          continue;
        }

        try {
          // Check if we've already sent a reminder for this event to this user
          // Look for EVENT_UPDATE notifications for this event and user in the last hour
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          const recentNotifications = await prisma.notification.findMany({
            where: {
              userId: member.userId,
              type: 'EVENT_UPDATE',
              createdAt: {
                gte: oneHourAgo,
              },
            },
            select: {
              data: true,
            },
          });

          // Check if any of the recent notifications is for this event
          const hasExistingReminder = recentNotifications.some((notification) => {
            if (notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data)) {
              const data = notification.data as any;
              return data.eventId === event.id && data.reminderType === '30min';
            }
            return false;
          });

          if (hasExistingReminder) {
            console.log(`[CRON] Skipping reminder for user ${member.userId}, event ${event.id} - already sent`);
            remindersSkipped++;
            continue;
          }

          // Send the reminder notification
          await notificationService.createNotification({
            userId: member.userId,
            type: 'EVENT_UPDATE',
            title: '活動提醒',
            body: `活動「${event.name}」將在 30 分鐘後開始`,
            data: {
              eventId: event.id,
              eventName: event.name,
              reminderType: '30min',
            },
            sendPush: true,
          });

          remindersSent++;
          console.log(`[CRON] Sent reminder to user ${member.userId} for event ${event.id} (${event.name})`);
        } catch (error) {
          console.error(`[CRON] Error sending reminder to user ${member.userId} for event ${event.id}:`, error);
          // Continue with other members even if one fails
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Event reminders check completed in ${duration}ms`);
    console.log(`[CRON] Summary: ${remindersSent} sent, ${remindersSkipped} skipped`);

    res.json({
      success: true,
      timestamp: now.toISOString(),
      eventsChecked: events.length,
      remindersSent,
      remindersSkipped,
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error in event reminders check:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
    });
  }
}

// Register the cron endpoint
router.get('/event-reminders', checkEventReminders);

export default router;

