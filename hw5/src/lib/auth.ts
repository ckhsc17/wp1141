import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { CustomPrismaAdapter } from "./custom-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
    newUser: '/register/setup',
  },
  callbacks: {
    async session({ session, user }) {
      try {
        if (session.user && user) {
          (session.user as any).id = user.id
          // 直接從 user 物件讀取 userId，避免額外的 database 查詢
          ;(session.user as any).userId = (user as any).userId
          
          // 如果 userId 不存在，記錄錯誤但不讓 session 失敗
          if (!(user as any).userId) {
            console.warn('[Auth] User object missing userId field:', {
              userId: user.id,
              email: user.email,
            })
          }
        }
        return session
      } catch (error) {
        console.error('[Auth] Error in session callback:', error)
        // 即使出錯也返回 session，避免登出
        return session
      }
    },
  },
}

