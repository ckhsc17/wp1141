import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userController } from '@/server/controllers/userController'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  return userController.searchUsers(request, session?.user?.id)
}

