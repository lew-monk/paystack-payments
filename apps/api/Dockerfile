# apps/api/Dockerfile
FROM oven/bun:1.1.20 AS builder
WORKDIR /app

# Tell msgpackr to never hard-fail and to not force native builds
ENV MSGPACKR_EXTRACT_FAILURES=soft \
	npm_config_build_from_source=false \
	npm_config_optional=true

COPY package.json ./
RUN bun install --ci

COPY . .

FROM oven/bun:1.1.20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["bun", "run", "start"]
