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
  } as Adapter
}

