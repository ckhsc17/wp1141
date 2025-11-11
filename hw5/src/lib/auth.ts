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
    strategy: "jwt",  // 改用 JWT session
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
    newUser: '/register/setup',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn callback:', { 
        userId: user.id, 
        provider: account?.provider,
        hasUserId: Boolean((user as any).userId)
      })
      // 允許所有 OAuth 登入
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      // 首次登入時（user 存在），將資料存入 JWT token
      if (user) {
        console.log('[Auth JWT] First sign in, storing user data:', {
          id: user.id,
          userId: (user as any).userId,
          email: user.email,
        })
        token.id = user.id
        token.userId = (user as any).userId || null
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      
      // 處理 session update（例如用戶設定 userId 後）
      if (trigger === 'update' && session) {
        console.log('[Auth JWT] Session update triggered:', session)
        // 從 session 更新 token
        if (session.userId !== undefined) {
          token.userId = session.userId
        }
        if (session.name !== undefined) {
          token.name = session.name
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // 從 JWT token 讀取資料到 session（無需查詢 DB）
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).userId = token.userId as string | null
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        
        console.log('[Auth Session] Session created from JWT:', {
          id: token.id,
          userId: token.userId,
          hasUserId: Boolean(token.userId),
        })
      }
      return session
    },
  },
}

