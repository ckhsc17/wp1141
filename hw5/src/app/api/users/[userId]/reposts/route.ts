import { NextRequest } from 'next/server'
import { repostController } from '@/server/controllers/repostController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return repostController.getUserReposts(userId, request)
}

