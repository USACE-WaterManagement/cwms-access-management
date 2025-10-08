# Multi-stage build for lean production image
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/services/authorizer-proxy/package.json ./apps/services/authorizer-proxy/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @cwms-access-management/authorizer-proxy...

# Copy source code
COPY apps/services/authorizer-proxy ./apps/services/authorizer-proxy
COPY eslint.config.js ./

# Build the application
RUN pnpm nx build authorizer-proxy

# Stage 2: Production stage - using Node 24 alpine for minimal size
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist/apps/services/authorizer-proxy ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/services/authorizer-proxy/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]

# Switch to non-root user
USER nodejs

# Run the application
CMD ["node", "server.js"]