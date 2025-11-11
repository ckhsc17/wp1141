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
          
          // 嘗試從 user 物件讀取 userId
          let userId = (user as any).userId
          
          // 如果 user 物件中沒有 userId，查詢 database（fallback）
          if (!userId) {
            console.log('[Auth] userId not in user object, querying database')
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { userId: true },
              })
              userId = dbUser?.userId
            } catch (dbError) {
              console.error('[Auth] Failed to query userId:', dbError)
            }
          }
          
          ;(session.user as any).userId = userId
          
          if (!userId) {
            console.warn('[Auth] User has no userId set (new user?):', {
              id: user.id,
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

