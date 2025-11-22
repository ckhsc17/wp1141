import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/admin/services/analyticsService';
import { PrismaAnalyticsRepository } from '@/admin/repositories/analyticsRepository';

const analyticsRepo = new PrismaAnalyticsRepository();
const analyticsService = new AnalyticsService(analyticsRepo);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const dateRange = startDate || endDate ? { startDate, endDate } : undefined;

    const [userStats, conversationStats, intentDistribution, dailyActivity] = await Promise.all([
      analyticsService.getUserStats(dateRange),
      analyticsService.getConversationStats(dateRange),
      analyticsService.getIntentDistribution(dateRange),
      analyticsService.getDailyActivity(dateRange),
    ]);

    return NextResponse.json({
      userStats,
      conversationStats,
      intentDistribution,
      dailyActivity,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

