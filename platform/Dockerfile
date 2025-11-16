# ============================================================================
# ASIF PLATFORM - Dockerfile
# Platform Owner: Asif | Business License: Baron Car Rental
# ============================================================================
# Multi-stage build for production-ready platform container

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Create platform user for security
RUN addgroup -g 1001 platform && \
    adduser -D -u 1001 -G platform platform && \
    mkdir -p /app/logs /app/uploads /app/platform-source && \
    chown -R platform:platform /app

# Copy built artifacts from builder
COPY --from=builder --chown=platform:platform /app/node_modules ./node_modules
COPY --from=builder --chown=platform:platform /app/dist ./dist
COPY --from=builder --chown=platform:platform /app/package*.json ./
COPY --chown=platform:platform prisma ./prisma

# Copy entire platform source code for SSH read-only access
COPY --chown=platform:platform . ./platform-source/

# Switch to non-root user
USER platform

# Expose ports
# 6000: HTTP API (Platform Control Plane)
# 2222: SSH Server (Read-only source code access)
# 6001: WebSocket Server (Real-time tenant communication)
EXPOSE 6000 2222 6001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start platform server
CMD ["node", "dist/index.js"]
