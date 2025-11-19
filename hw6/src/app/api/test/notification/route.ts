import { NextRequest, NextResponse } from 'next/server';

import { lineClient } from '@/bot/lineBot';
import { repositories } from '@/container';
import { prisma } from '@/repositories/prismaClient';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint for manually triggering todo notifications
 * 
 * Usage:
 * 1. Create a test reminder with triggerAt in the past
 * 2. Call this endpoint to send notifications
 * 
 * GET /api/test/notification?userId=YOUR_LINE_USER_ID
 * 
 * Or create a test reminder and trigger it:
 * POST /api/test/notification
 * Body: { "userId": "YOUR_LINE_USER_ID", "title": "測試提醒", "triggerAt": "2024-01-01T00:00:00Z" }
 */
export async function GET(req: NextRequest): Promise<Response> {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required. Usage: /api/test/notification?userId=YOUR_LINE_USER_ID' },
      { status: 400 },
    );
  }

  try {
    // Find pending reminders for this user that should be triggered
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
        triggerAt: { lte: now },
      },
    });

    if (reminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reminders found to send',
        userId,
        suggestion: 'Create a reminder with triggerAt in the past to test',
      });
    }

    let sentCount = 0;
    const results: Array<{ reminderId: string; title: string; status: string }> = [];

    for (const reminder of reminders) {
      try {
        await lineClient.pushMessages(reminder.userId, [
          {
            type: 'text',
            text: `⏰ 測試提醒：${reminder.title}`,
          },
        ]);

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: now,
          },
        });

        sentCount++;
        results.push({
          reminderId: reminder.id,
          title: reminder.title,
          status: 'sent',
        });
      } catch (error) {
        results.push({
          reminderId: reminder.id,
          title: reminder.title,
          status: 'failed',
        });
        logger.error('Failed to send test notification', {
          reminderId: reminder.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      found: reminders.length,
      sent: sentCount,
      results,
    });
  } catch (error) {
    logger.error('Test notification endpoint failed', {
      error: error instanceof Error ? error.message : String(error),
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

/**
 * Create a test reminder and immediately trigger it
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { userId, title, triggerAt } = body as {
      userId: string;
      title: string;
      triggerAt?: string;
    };

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'userId and title are required' },
        { status: 400 },
      );
    }

    // Create a test reminder with triggerAt in the past (or now)
    const testTriggerAt = triggerAt ? new Date(triggerAt) : new Date(Date.now() - 1000); // 1 second ago

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        triggerAt: testTriggerAt,
        status: 'PENDING',
      },
    });

    // Immediately send the notification
    try {
      await lineClient.pushMessages(userId, [
        {
          type: 'text',
          text: `⏰ 測試提醒：${title}`,
        },
      ]);

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Test reminder created and notification sent',
        reminder: {
          id: reminder.id,
          title: reminder.title,
          triggerAt: reminder.triggerAt,
          status: 'SENT',
        },
      });
    } catch (error) {
      // If push fails, still return the reminder info
      return NextResponse.json(
        {
          success: false,
          message: 'Reminder created but notification failed to send',
          reminder: {
            id: reminder.id,
            title: reminder.title,
            triggerAt: reminder.triggerAt,
          },
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('Test notification POST failed', {
      error: error instanceof Error ? error.message : String(error),
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

