import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import prisma from './prisma';
import { signToken } from '../utils/jwt';
import { generateUserId } from './userUtils';

// Note: We don't use Passport sessions - we use JWT cookies instead
// serializeUser and deserializeUser are not needed

// Google OAuth Strategy
console.log('[PASSPORT] Initializing Google OAuth Strategy...');
console.log('[PASSPORT] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('[PASSPORT] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackURL = (() => {
    // Priority: BACKEND_URL > VERCEL_URL > localhost
    if (process.env.BACKEND_URL) {
      console.log('[PASSPORT] Google callback URL (BACKEND_URL):', `${process.env.BACKEND_URL}/auth/google/callback`);
      return `${process.env.BACKEND_URL}/auth/google/callback`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/auth/google/callback`;
    }
    return 'https://meet-half-backend.vercel.app/auth/google/callback';
  })();
  
  console.log('[PASSPORT] Google callback URL:', googleCallbackURL);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: googleCallbackURL,
      },
      async (accessToken: any, refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || email || 'User';
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Find existing user by googleId or email
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId: profile.id },
                { email },
              ],
            },
          });

          if (user) {
            // Update existing user with Google info
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                name: user.name || name,
                email,
                avatar: avatar || user.avatar,
                provider: 'GOOGLE',
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new user WITHOUT userId (will be set during first-time setup)
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                name,
                avatar,
                provider: 'GOOGLE',
                needsSetup: true, // Mark as needing first-time setup
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
  console.log('[PASSPORT] ✓ Google OAuth Strategy initialized successfully');
} else {
  console.warn('[PASSPORT] ✗ Google OAuth Strategy NOT initialized - missing credentials');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: (() => {
          // Priority: BACKEND_URL > VERCEL_URL > localhost
          if (process.env.BACKEND_URL) {
            const url = `${process.env.BACKEND_URL}/auth/github/callback`;
            console.log('[PASSPORT] GitHub callback URL (BACKEND_URL):', url);
            return url;
          }
          if (process.env.VERCEL_URL) {
            const url = `https://${process.env.VERCEL_URL}/auth/github/callback`;
            console.log('[PASSPORT] GitHub callback URL (VERCEL_URL):', url);
            return url;
          }
          const url = 'http://localhost:3000/auth/github/callback';
          console.log('[PASSPORT] GitHub callback URL (localhost):', url);
          return url;
        })(),
      },
      async (accessToken: any, refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
          const name = profile.displayName || profile.username || email || 'User';
          const avatar = profile.photos?.[0]?.value;

          // Find existing user by githubId or email
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { githubId: profile.id.toString() },
                { email },
              ],
            },
          });

          if (user) {
            // Update existing user with GitHub info
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                githubId: profile.id.toString(),
                name: user.name || name,
                email,
                avatar: avatar || user.avatar,
                provider: 'GITHUB',
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new user WITHOUT userId (will be set during first-time setup)
            user = await prisma.user.create({
              data: {
                githubId: profile.id.toString(),
                email,
                name,
                avatar,
                provider: 'GITHUB',
                needsSetup: true, // Mark as needing first-time setup
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
}

export default passport;

