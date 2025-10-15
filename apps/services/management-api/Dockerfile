# Multi-stage build for lean production image
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/services/management-api/package.json ./apps/services/management-api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @cwms-access-management/management-api...

# Copy source code
COPY apps/services/management-api ./apps/services/management-api
COPY eslint.config.js ./

# Build the application
RUN pnpm nx build management-api

# Stage 2: Production stage - using Node 24 alpine for minimal size
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist/apps/services/management-api ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/services/management-api/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV MANAGEMENT_API_PORT=3002
ENV MANAGEMENT_API_HOST=0.0.0.0

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3002/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]

# Switch to non-root user
USER nodejs

# Run the application
CMD ["node", "index.js"]
