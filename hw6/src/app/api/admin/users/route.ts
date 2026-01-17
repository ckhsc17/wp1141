import { NextRequest, NextResponse } from 'next/server';
import { PrismaUserRepository } from '@/repositories';

const userRepo = new PrismaUserRepository();

// GET /api/admin/users?query=... - Search users by name/ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const users = await userRepo.searchUsers(query, limit);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to search users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/:id - Update user VIP status or token limit
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { isVIP, tokenLimit } = body;

    if (typeof isVIP === 'boolean') {
      const user = await userRepo.updateUserVIP(id, isVIP);
      return NextResponse.json({ user });
    }

    if (tokenLimit !== undefined) {
      const tokenLimitValue = tokenLimit === null ? null : parseInt(String(tokenLimit), 10);
      if (tokenLimitValue !== null && (isNaN(tokenLimitValue) || tokenLimitValue <= 0)) {
        return NextResponse.json({ error: 'Token limit must be a positive number or null' }, { status: 400 });
      }
      const user = await userRepo.updateUserTokenLimit(id, tokenLimitValue);
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
