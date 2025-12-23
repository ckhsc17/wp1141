FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 5173

# Start dev server (for development) or serve static files (for production)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
