# === Build stage ===
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency files first for caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (dev + prod)
RUN npm ci

# Copy rest of code and build
COPY . .
RUN npx prisma generate && npm run build

# Remove dev dependencies to keep only production deps
RUN npm prune --production


# === Runtime stage ===
FROM node:18-alpine AS runner
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy only necessary files from builder
COPY --from=builder /app /app

# Adjust ownership
RUN chown -R nodejs:nodejs /app

# Create symlink so dist code can find generated prisma
USER nodejs
RUN ln -s /app/src/generated /app/generated

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health',(r)=>process.exit(r.statusCode===200?0:1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
