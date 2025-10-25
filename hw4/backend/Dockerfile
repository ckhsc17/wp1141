# === Build stage ===
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build
RUN npm prune --production

# === Runtime stage ===
FROM node:18-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# 帶入所有建置產物與相依
COPY --from=builder /app /app

# 直接複製產生物到 dist，確保 require('../generated/prisma') 能找到
RUN mkdir -p /app/dist \
 && cp -a /app/src/generated /app/dist/generated \
 && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health',(r)=>process.exit(r.statusCode===200?0:1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
