declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      FRONTEND_ORIGIN?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      GOOGLE_MAPS_SERVER_KEY?: string;
      // OAuth configuration
      BACKEND_URL?: string; // Base URL for OAuth callbacks (e.g., http://localhost:3000 or https://your-backend.vercel.app)
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GITHUB_CLIENT_ID?: string;
      GITHUB_CLIENT_SECRET?: string;
    }
  }
}

export {};


