# ---------- 1) builder (with build tools) ----------
FROM oven/bun:1.1.20-alpine AS builder
WORKDIR /app

# Tools for native builds
RUN apk add --no-cache python3 make g++ libc6-compat curl

COPY package.json ./
ENV MSGPACKR_EXTRACT_FAILURES=soft \
	npm_config_build_from_source=false
RUN bun install --ci

COPY . .

# Optional checks
# RUN bun x tsc -p tsconfig.json --noEmit

# ---------- 2) runner (tiny) ----------
FROM oven/bun:1.1.20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
	CMD wget -qO- http://localhost:3000/healthz >/dev/null || exit 1

CMD ["bun", "run", "start"]
