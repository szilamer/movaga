# syntax=docker/dockerfile:1

FROM node:18-slim AS deps
WORKDIR /app
# Add build essentials for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libssl-dev \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-slim AS builder
WORKDIR /app
# Add build essentials for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libssl-dev \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
CMD ["./entrypoint.sh"] 