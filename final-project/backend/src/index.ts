import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from './lib/passport';
import { swaggerSpec } from './config/swagger';
import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import eventInvitationsRouter from './routes/eventInvitations';
import membersRouter from './routes/members';
import mapsRouter from './routes/maps';
import usersRouter from './routes/users';
import inviteRouter from './routes/invite';
import friendsRouter from './routes/friends';
import chatRouter from './routes/chat';
import notificationsRouter from './routes/notifications';
import groupsRouter from './routes/groups';
import cronRouter from './routes/cron';
import { mapsRateLimiter } from './middleware/rateLimit';

// Load environment variables
dotenv.config();

console.log('[INIT] Starting application initialization...');
console.log('[INIT] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_URL: process.env.VERCEL_URL,
  PORT: process.env.PORT,
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy - Required for Vercel to correctly detect HTTPS
// This allows Express to trust X-Forwarded-* headers from Vercel's proxy
app.set('trust proxy', true);

// Security middlewares
// Configure Helmet with CSP that allows Swagger UI CDN resources
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          "'unsafe-inline'", // Required for Swagger UI inline scripts
        ],
        styleSrc: [
          "'self'",
          'https://cdn.jsdelivr.net',
          "'unsafe-inline'", // Required for Swagger UI inline styles
        ],
        connectSrc: [
          "'self'",
          'https://cdn.jsdelivr.net', // Allow Swagger UI to load resources from CDN
        ],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration - allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  // Production frontend origins (Vercel, etc.)
  process.env.FRONTEND_ORIGIN,
].filter(Boolean) as string[];

// Helper to check if origin is a Vercel deployment
const isVercelOrigin = (origin: string): boolean => {
  return /^https:\/\/.*\.vercel\.app$/.test(origin);
};

// Helper to conditionally log (only in development or when DEBUG=true)
const shouldLog = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
const debugLog = shouldLog ? console.log : () => {};
const debugWarn = shouldLog ? console.warn : () => {};

app.use(
  cors({
    origin: (origin, callback) => {
      debugLog('[CORS] Checking origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        debugLog('[CORS] ✓ No origin, allowing request');
        return callback(null, true);
      }
      
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        debugLog('[CORS] ✓ Development mode, allowing origin:', origin);
        return callback(null, true);
      }
      
      // If FRONTEND_ORIGIN is explicitly set, check it first (more secure)
      if (process.env.FRONTEND_ORIGIN) {
        const isAllowed = allowedOrigins.some(allowed => origin === allowed);
        if (isAllowed) {
          debugLog('[CORS] ✓ Origin allowed (FRONTEND_ORIGIN match):', origin);
          return callback(null, true);
        }
        // If FRONTEND_ORIGIN is set but doesn't match, check if it's a Vercel origin
        // (useful for preview deployments that match the pattern)
        if (isVercelOrigin(origin)) {
          debugLog('[CORS] ✓ Origin allowed (Vercel origin):', origin);
          return callback(null, true);
        }
        debugWarn(`[CORS] ✗ Blocked origin: ${origin} (FRONTEND_ORIGIN is set to: ${process.env.FRONTEND_ORIGIN})`);
        return callback(new Error('Not allowed by CORS'));
      }
      
      // If FRONTEND_ORIGIN is not set, allow all Vercel preview deployments
      // (fallback for convenience when FRONTEND_ORIGIN is not configured)
      if (isVercelOrigin(origin)) {
        debugLog('[CORS] ✓ Origin allowed (Vercel origin, no FRONTEND_ORIGIN):', origin);
        return callback(null, true);
      }
      
      // Check against explicitly allowed origins (localhost, etc.)
      const isAllowed = allowedOrigins.some(allowed => origin === allowed);
      
      if (isAllowed) {
        debugLog('[CORS] ✓ Origin allowed (explicit match):', origin);
        callback(null, true);
      } else {
        debugWarn(`[CORS] ✗ Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Initialize Passport (no session needed - we use JWT cookies)
app.use(passport.initialize());

app.use(cookieParser());
app.use(express.json());

// Request logging middleware (only log in development or when DEBUG=true)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (shouldLog) {
    console.log('[REQUEST]', {
      method: req.method,
      path: req.path,
      url: req.url,
    });
  }
  next();
});

// Health check
app.get('/healthz', (req: Request, res: Response) => {
  console.log('[HEALTH] Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI - Use CDN resources to avoid static file serving issues on Vercel
// Serve JSON spec at /api-docs.json
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI HTML page with CDN resources
app.get('/api-docs', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MeetHalf API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      // Use window.location.origin to get the current base URL dynamically
      const specUrl = window.location.origin + '/api-docs.json';
      const ui = SwaggerUIBundle({
        url: specUrl,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true
      });
    };
  </script>
</body>
</html>`;
  
  res.send(html);
});

// Routes
console.log('[ROUTES] Registering routes...');
app.use('/auth', authRouter);
console.log('[ROUTES] ✓ /auth registered');
app.use('/events', eventsRouter);
console.log('[ROUTES] ✓ /events registered');
app.use('/events', eventInvitationsRouter);
console.log('[ROUTES] ✓ /events (invitations) registered');
app.use('/members', membersRouter);
console.log('[ROUTES] ✓ /members registered');
app.use('/maps', mapsRateLimiter, mapsRouter);
console.log('[ROUTES] ✓ /maps registered');
app.use('/users', usersRouter);
console.log('[ROUTES] ✓ /users registered');
app.use('/invite', inviteRouter);
console.log('[ROUTES] ✓ /invite registered');
app.use('/friends', friendsRouter);
console.log('[ROUTES] ✓ /friends registered');
app.use('/chat', chatRouter);
console.log('[ROUTES] ✓ /chat registered');
app.use('/notifications', notificationsRouter);
console.log('[ROUTES] ✓ /notifications registered');
app.use('/groups', groupsRouter);
console.log('[ROUTES] ✓ /groups registered');
app.use('/api/cron', cronRouter);
console.log('[ROUTES] ✓ /api/cron registered');
console.log('[ROUTES] All routes registered successfully');

// 404 handler
app.use((req: Request, res: Response) => {
  console.log('[404] Route not found:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
  });
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
interface AppError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Unhandled error:', {
    error: err.message,
    stack: err.stack,
    code: err.code,
    status: err.status,
    path: req.path,
    method: req.method,
    url: req.url,
  });
  
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: err.details,
  });
});

// Export app for Vercel serverless function
// @vercel/node automatically handles Express apps exported as default
console.log('[EXPORT] Exporting Express app for Vercel...');
export default app;
console.log('[EXPORT] ✓ App exported successfully');

// Guard: do not start server in test mode or Vercel environment
if (process.env.NODE_ENV === 'test' || process.env.VERCEL) {
  // Test mode or Vercel, skip server startup
  // Vercel will use the exported handler instead
  console.log('[SERVER] Skipping server startup (test mode or Vercel environment)');
  console.log('[SERVER] Vercel will use the exported handler');
} else {
  // Start server only in non-test, non-Vercel environments
  // Use 0.0.0.0 to allow external connections (e.g., from containers)
  // Use 127.0.0.1 for local development security
  const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/healthz`);
  });
}

