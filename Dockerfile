# Dockerfile for ClawTerm Production Deployment
FROM oven/bun:1 as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production

WORKDIR /app

# Install runtime dependencies only
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy built files
COPY --from=base /app/dist ./dist

# Create data directory for SQLite and logs
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV CLAW_DATA_DIR=/app/data
ENV CLAW_LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run dist/healthcheck.js || exit 1

# Expose port for API/webhook server
EXPOSE 3000

# Run the orchestrator
CMD ["bun", "run", "dist/orchestrator.js"]
