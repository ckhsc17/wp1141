# === Build stage ===
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build   # 只負責編譯，不在這裡 generate

# === Runtime stage ===
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# signal 處理與非 root
RUN apk add --no-cache dumb-init
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# 只帶入執行需要的檔案
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 安裝 production 依賴（含 @prisma/client）
RUN npm ci --omit=dev \
 && npm cache clean --force

# 在最終平台生成 Prisma client（避免平台不符）
# 不需要把 prisma CLI 放進依賴，用臨時 npx 取用即可
RUN npx --yes prisma@latest generate

USER nodejs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health',(r)=>process.exit(r.statusCode===200?0:1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]