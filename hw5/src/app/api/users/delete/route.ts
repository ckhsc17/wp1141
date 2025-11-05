import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    if (!userId) {
      return NextResponse.json(
        { error: '無法識別用戶' },
        { status: 400 }
      )
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: '用戶不存在' },
        { status: 404 }
      )
    }

    // 删除用户及其所有相关数据
    // 由于 Prisma schema 中设置了 onDelete: Cascade，删除 User 会自动删除：
    // - Account, Session (NextAuth 相关)
    // - Posts, Likes, Comments, Drafts
    // - Follow (following/followers)
    // - Mentions
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json(
      { 
        success: true,
        message: '您的帳號及所有相關資料已成功刪除' 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('刪除用戶資料時發生錯誤:', error)
    return NextResponse.json(
      { error: '刪除資料時發生錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}

