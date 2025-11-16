# ============================================================================
# BARON BACKEND - Dockerfile
# Business Instance running on Asif Platform
# ============================================================================

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

# Production stage
FROM node:18-alpine

RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Create app user
RUN addgroup -g 1001 baron && \
    adduser -D -u 1001 -G baron baron && \
    mkdir -p /app/logs /app/uploads && \
    chown -R baron:baron /app

# Copy artifacts
COPY --from=builder --chown=baron:baron /app/node_modules ./node_modules
COPY --from=builder --chown=baron:baron /app/dist ./dist
COPY --from=builder --chown=baron:baron /app/package*.json ./
COPY --chown=baron:baron prisma ./prisma

USER baron

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
