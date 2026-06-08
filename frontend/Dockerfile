# ── Frontend Dockerfile ───────────────────────────────────────────────────────
# Next.js 14 with standalone output for minimal image size.
# Build arg NEXT_PUBLIC_API_URL is injected at build time by Coolify.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Accept the public API URL at build time (Coolify env var)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:4000}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Enable Next.js standalone output (smaller Docker image)
RUN echo "Building with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what Next.js standalone needs
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
