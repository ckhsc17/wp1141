import { NextRequest } from 'next/server'
import { userController } from '@/server/controllers/userController'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return userController.getUser(params.userId)
}

