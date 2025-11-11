import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { Adapter } from "next-auth/adapters"

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  // 先建立標準 PrismaAdapter
  const baseAdapter = PrismaAdapter(prisma)
  
  // 擴展並覆寫需要的方法
  return {
    ...baseAdapter,
    async getUserByEmail(email: string) {
      // email 不再是 unique
      // 為了避免不同 provider 之間的互相影響，這個方法直接返回 null
      // NextAuth 會使用 provider+accountId 來正確查找用戶
      return null
    },
    async getUser(id: string) {
      console.log('[Adapter] getUser called for id:', id)
      // 覆寫：明確包含 userId 欄位
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          userId: true,  // 關鍵：確保包含 userId
        },
      })
      console.log('[Adapter] getUser result:', user ? { id: user.id, userId: user.userId } : null)
      return user as any
    },
    async getUserByAccount({ providerAccountId, provider }) {
      console.log('[Adapter] getUserByAccount called:', { provider, providerAccountId })
      // 覆寫：明確包含 userId 欄位
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
              userId: true,  // 關鍵：確保包含 userId
            },
          },
        },
      })
      console.log('[Adapter] getUserByAccount result:', account?.user ? { id: account.user.id, userId: account.user.userId } : null)
      return account?.user as any
    },
  } as Adapter
}

