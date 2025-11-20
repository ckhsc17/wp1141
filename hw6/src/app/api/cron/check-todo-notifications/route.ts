import { NextRequest, NextResponse } from 'next/server';

import { lineClient } from '@/bot/lineBot';
import { repositories } from '@/container';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint to check and send todo notifications
 * 
 * Note: Vercel Hobby plan only allows one cron job per day.
 * Current schedule: Daily at 8:00 AM (Asia/Taipei, UTC+8).
 * Cron expression: "0 0 * * *" (UTC 00:00 = Asia/Taipei 08:00)
 * 
 * For more frequent checks (e.g., every 5 minutes), consider:
 * - Upgrading to Vercel Pro plan
 * - Using external cron services (e.g., cron-job.org, EasyCron)
 * - Using webhook-based solutions
 */
export async function GET(req: NextRequest): Promise<Response> {
  // Optional: Add authentication to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    logger.info('Checking todo notifications', { timestamp: now.toISOString() });

    // Find all pending reminders that should be triggered
    // Note: listPending requires userId, so we need to query all users first
    // For now, we'll query directly from Prisma
    const { prisma } = await import('@/repositories/prismaClient');
    const remindersToSend = await prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        triggerAt: { lte: now },
      },
    });

    logger.info('Found reminders to send', { count: remindersToSend.length });

    let sentCount = 0;
    let errorCount = 0;

    for (const reminder of remindersToSend) {
      try {
        // Get todo information if reminder is linked to a todo
        let todo = null;
        if (reminder.todoId) {
          todo = await prisma.todo.findUnique({
            where: { id: reminder.todoId },
          });
        }

        // Build notification message
        let notificationText = `⏰ 提醒：${reminder.title}`;
        // if (reminder.description) {
        //   notificationText += `\n${reminder.description}`;
        // }
        if (todo) {
          const dateStr = todo.date
            ? new Date(todo.date).toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          if (dateStr) {
            notificationText += `\n時間：${dateStr}`;
          }
          if (todo.description) {
            notificationText += `\n${todo.description}`;
          }
        }

        // Send push message to LINE user
        // Note: reminder.userId is the LINE user ID (User.id = LINE user ID)
        // messaging-api-line will automatically call POST /v2/bot/message/push
        await lineClient.pushMessages(reminder.userId, [
          {
            type: 'text',
            text: notificationText,
          },
        ]);

        // Update reminder status to SENT
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: now,
          },
        });

        sentCount++;
        logger.info('Todo notification sent', {
          reminderId: reminder.id,
          userId: reminder.userId,
          title: reminder.title,
          notificationText: notificationText.slice(0, 100), // Log first 100 chars
        });
      } catch (error) {
        errorCount++;
        logger.error('Failed to send todo notification', {
          reminderId: reminder.id,
          userId: reminder.userId,
          title: reminder.title,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checked: remindersToSend.length,
      sent: sentCount,
      errors: errorCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

