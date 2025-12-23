import { Router, Request, Response } from 'express';
import passport from '../lib/passport';
import prisma from '../lib/prisma';
import { signToken, generateTempAuthToken } from '../utils/jwt';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Helper function to get consistent cookie options
function getCookieOptions(req: Request): any {
  const isDeployed = !!process.env.VERCEL_URL || req.protocol === 'https';
  const cookieOptions: any = {
    httpOnly: true,
    sameSite: isDeployed ? ('none' as const) : ('lax' as const),
    secure: isDeployed,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  return cookieOptions;
}

// Helper function to get frontend origin with smart fallback
function getFrontendOrigin(): string {
  // Priority: FRONTEND_ORIGIN > VERCEL_URL (for preview deployments) > localhost
  if (process.env.FRONTEND_ORIGIN) {
    return process.env.FRONTEND_ORIGIN;
  }
  // In production/Vercel, try to infer frontend URL from backend URL
  if (process.env.VERCEL_URL) {
    // If backend is on Vercel, frontend might be on same domain or different subdomain
    // This is a fallback - should set FRONTEND_ORIGIN explicitly
    console.warn('[AUTH] FRONTEND_ORIGIN not set, using VERCEL_URL fallback');
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:5173';
}

// Helper function to set JWT cookie and redirect
function setAuthCookieAndRedirect(req: Request, res: Response, user: any) {
  const token = signToken(user.id);
  const cookieOptions = getCookieOptions(req);
  cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  console.log('[AUTH] Setting auth cookie:', {
    userId: user.id,
    tokenLength: token.length,
    cookieOptions: {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      domain: cookieOptions.domain || 'not set',
      maxAge: cookieOptions.maxAge,
    },
    protocol: req.protocol,
    host: req.headers.host,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
  });

  // Set cookie (primary method - most secure)
  res.cookie('token', token, cookieOptions);

  // For mobile devices that may block cookies, use a temporary one-time token
  // This is more secure than passing the JWT directly in URL
  const tempToken = generateTempAuthToken(user.id);
  const frontendOrigin = getFrontendOrigin();
  
  // Check if user needs first-time setup
  let redirectUrl: string;
  if (user.needsSetup) {
    // Redirect to first-time setup page
    redirectUrl = `${frontendOrigin}/first-time-setup?auth_temp=${encodeURIComponent(tempToken)}`;
    console.log('[AUTH] New user - redirecting to first-time setup');
  } else {
    // Pass temporary token in URL (safer: short-lived, one-time use)
    // Frontend will exchange this for the real JWT via API call
    // Redirect to /events directly to avoid frontend root redirect stripping params
    redirectUrl = `${frontendOrigin}/events?auth_temp=${encodeURIComponent(tempToken)}`;
    console.log('[AUTH] Existing user - redirecting to events');
  }
  
  console.log('[AUTH] Redirecting to frontend with temp token (for mobile fallback)');
  res.redirect(redirectUrl);
}

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT cookie set
 */
router.get(
  '/google/callback',
  (req: Request, res: Response, next: any) => {
    console.log('[AUTH] ✓ Google callback received');
    console.log('[AUTH] Query params:', req.query);
    
    passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error('[AUTH] ❌ Google OAuth error:');
        console.error('[AUTH] Message:', err.message);
        console.error('[AUTH] Stack:', err.stack);
        console.error('[AUTH] Full error:', JSON.stringify(err, null, 2));
        const frontendOrigin = getFrontendOrigin();
        return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
      }
      if (!user) {
        console.error('[AUTH] ❌ Google OAuth: No user returned');
        console.error('[AUTH] Info:', info);
        const frontendOrigin = getFrontendOrigin();
        return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
      }
      
      console.log('[AUTH] ✓ Google OAuth success, user:', {
        id: user.id,
        userId: user.userId,
        email: user.email,
        name: user.name,
      });
      // Attach user to request
      (req as any).user = user;
      next();
    })(req, res, next);
  },
  (req: Request, res: Response) => {
    // @ts-ignore - passport adds user to request
    const user = (req as any).user;
    if (!user) {
      const frontendOrigin = getFrontendOrigin();
      return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
    }
    setAuthCookieAndRedirect(req, res, user);
  }
);

/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Start GitHub OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth
 */
router.get('/github', (req: Request, res: Response, next: any) => {
  console.log('[AUTH] GitHub login initiated', {
    query: req.query,
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
    },
  });
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT cookie set
 */
router.get(
  '/github/callback',
  (req: Request, res: Response, next: any) => {
    console.log('[AUTH] GitHub callback received', {
      query: req.query,
      path: req.path,
      url: req.url,
    });
    
    // Custom callback handler - same pattern as Google for consistency
    // This allows us to redirect to frontend on error instead of backend root
    passport.authenticate('github', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error('[AUTH] GitHub OAuth error:', err);
        const frontendOrigin = getFrontendOrigin();
        return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
      }
      if (!user) {
        console.error('[AUTH] GitHub OAuth: No user returned', info);
        const frontendOrigin = getFrontendOrigin();
        return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
      }
      console.log('[AUTH] GitHub OAuth success, user:', { id: user.id, email: user.email });
      // Attach user to request
      (req as any).user = user;
      next();
    })(req, res, next);
  },
  (req: Request, res: Response) => {
    // @ts-ignore - passport adds user to request
    const user = (req as any).user;
    if (!user) {
      console.error('[AUTH] GitHub callback: No user in request');
      const frontendOrigin = getFrontendOrigin();
      return res.redirect(`${frontendOrigin}/login?error=auth_failed`);
    }
    setAuthCookieAndRedirect(req, res, user);
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user information (optional authentication)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User information or null if not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   nullable: true
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /auth/me - Optional authentication (returns user or null)
router.get('/me', optionalAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[AUTH] /auth/me request received', {
      hasUser: !!req.user,
      userType: req.user ? (typeof req.user === 'object' && 'userId' in req.user ? 'JWT' : 'guest') : 'none',
      hasCookies: Object.keys(req.cookies).length > 0,
      cookieKeys: Object.keys(req.cookies),
      hasAuthHeader: !!req.headers.authorization,
      origin: req.headers.origin,
      host: req.headers.host,
    });

    if (!req.user || !('userId' in req.user)) {
      // Not authenticated - return null user (anonymous mode)
      console.log('[AUTH] /auth/me: No user or not JWT user, returning null');
      res.json({ user: null });
      return;
    }

    const jwtPayload = req.user as { userId: number };
    const userId = jwtPayload.userId;
    console.log('[AUTH] /auth/me: Looking up user with id:', userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userId: true, // Add userId to response
        email: true,
        name: true,
        avatar: true,
        provider: true,
        needsSetup: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.error('[AUTH] /auth/me: User not found in database, id:', userId);
      res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    console.log('[AUTH] /auth/me: User found:', { id: user.id, email: user.email, userId: user.userId });
    res.json({ user });
  } catch (error) {
    console.error('[AUTH] /auth/me: Error:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An error occurred while fetching user',
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// POST /auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  console.log('[AUTH] Logout requested', {
    hasCookies: Object.keys(req.cookies).length > 0,
    cookieKeys: Object.keys(req.cookies),
  });
  
  // Use the same cookie options function to ensure consistency
  // This ensures we only clear cookies from the same domain/path where they were set
  const cookieOptions = getCookieOptions(req);
  console.log('[AUTH] Cookie options for logout:', cookieOptions);
  
  // Clear cookie with the exact same options used when setting it
  // This is safe because:
  // 1. Cookies are domain-scoped - only affects the current domain (or COOKIE_DOMAIN if set)
  // 2. Will NOT affect cookies from other websites (e.g., google.com)
  // 3. Will only clear the 'token' cookie, not other cookies
  res.clearCookie('token', cookieOptions);
  
  // Also try to clear with empty value and expired date as a fallback
  // This ensures the cookie is cleared even if clearCookie() doesn't work
  res.cookie('token', '', {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  
  console.log('[AUTH] Logout successful');
  res.json({ message: 'Logout successful' });
});

/**
 * @swagger
 * /auth/exchange-temp-token:
 *   post:
 *     summary: Exchange temporary auth token for JWT (mobile fallback)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temporary one-time authentication token
 *     responses:
 *       200:
 *         description: Exchange successful, JWT returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token (should be stored in sessionStorage)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired temp token
 *       401:
 *         description: Unauthorized
 */
// POST /auth/exchange-temp-token - Exchange temporary token for JWT (mobile fallback)
router.post('/exchange-temp-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken } = req.body;
    
    if (!tempToken || typeof tempToken !== 'string') {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'tempToken is required',
      });
      return;
    }

    // Verify temporary token
    const { verifyTempAuthToken } = await import('../utils/jwt');
    let tempPayload;
    try {
      tempPayload = verifyTempAuthToken(tempToken);
    } catch (error) {
      console.error('[AUTH] Invalid temp token:', error);
      res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired temporary token',
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: tempPayload.userId },
      select: {
        id: true,
        userId: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        needsSetup: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
      return;
    }

    // Generate real JWT token
    const realToken = signToken(user.id);
    
    // Also set cookie (in case it works)
    const cookieOptions = getCookieOptions(req);
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie('token', realToken, cookieOptions);

    console.log('[AUTH] Temp token exchanged successfully for user:', user.id);
    
    // Return JWT token (frontend should store in sessionStorage)
    res.json({
      token: realToken,
      user,
    });
  } catch (error: any) {
    console.error('[AUTH] Error exchanging temp token:', error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to exchange token',
    });
  }
});

export default router;
