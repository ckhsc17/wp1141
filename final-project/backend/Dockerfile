FROM node:18-alpine AS base

# Install PostgreSQL client tools for migrations
RUN apk add --no-cache wget postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

# Create startup script that runs migrations
RUN echo '#!/bin/sh\n\
set -e\n\
echo "🚀 Starting MeetHalf backend..."\n\
echo "📦 Running database migrations..."\n\
npx prisma migrate deploy || echo "⚠️  Migration skipped or database exists"\n\
echo "✅ Starting application..."\n\
exec node dist/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
