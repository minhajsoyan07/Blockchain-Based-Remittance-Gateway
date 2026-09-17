# Multi-stage Dockerfile for Next.js (production)
# Builds the app and runs `next start` on container start.

FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --silent || npm install --silent

# Copy source
COPY . ./

# Build
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent || npm install --production --silent

# Copy built next files from builder
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.mjs ./next.config.mjs
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT 3000

EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
