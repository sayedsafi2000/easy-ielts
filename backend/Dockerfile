# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Node 20 LTS on Alpine for a small image.
# Coolify will build this from the /backend directory.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy deps + source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure uploads directory exists (Cloudinary is used, but keep local fallback)
RUN mkdir -p uploads/audio uploads/images && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

# Healthcheck — Coolify uses this to know the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "server.js"]
