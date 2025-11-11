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
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn callback:', { 
        userId: user.id, 
        provider: account?.provider,
        hasUserId: Boolean((user as any).userId)
      })
      // 允許所有 OAuth 登入
      return true
    },
    async session({ session, user }) {
      try {
        if (session.user && user) {
          const userId = (user as any).userId || null
          ;(session.user as any).id = user.id
          ;(session.user as any).userId = userId
          
          if (!userId) {
            console.log('[Auth] User has no userId set (new user):', {
              id: user.id,
              email: user.email,
            })
          } else {
            console.log('[Auth] Session created for user:', {
              id: user.id,
              userId: userId,
            })
          }
        }
        return session
      } catch (error) {
        console.error('[Auth] Error in session callback:', error)
        return session
      }
    },
  },
}

