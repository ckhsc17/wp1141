import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { repostController } from '@/server/controllers/repostController'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  // 未登入時回傳預設值，不回 401
  if (!session?.user?.id) {
    return NextResponse.json({ reposted: false })
  }

  const { id } = await params
  return repostController.getRepostStatus(id, session.user.id)
}
