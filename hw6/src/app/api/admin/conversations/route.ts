import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/admin/services/conversationService';
import { PrismaConversationRepository } from '@/admin/repositories/conversationRepository';

const conversationRepo = new PrismaConversationRepository();
const conversationService = new ConversationService(conversationRepo);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const userName = searchParams.get('userName') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await conversationService.listConversations({
      userId,
      userName,
      startDate,
      endDate,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

