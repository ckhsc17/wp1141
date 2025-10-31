import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { commentController } from '@/server/controllers/commentController'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return commentController.getComments(params.id)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return commentController.createComment(params.id, request, session.user.id)
}

