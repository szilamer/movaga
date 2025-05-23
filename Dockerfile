# syntax=docker/dockerfile:1

FROM node:18-slim AS deps
WORKDIR /app
# Only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better caching
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-slim AS builder
WORKDIR /app
# Only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy everything
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NODE_ENV=production
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"] 