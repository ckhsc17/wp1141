import { NextRequest } from 'next/server'
import { userController } from '@/server/controllers/userController'

export async function GET(request: NextRequest) {
  return userController.searchUsers(request)
}

