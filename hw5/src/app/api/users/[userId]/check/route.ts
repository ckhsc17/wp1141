import { NextRequest } from 'next/server'
import { userController } from '@/server/controllers/userController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  return userController.checkUserId(userId)
}

