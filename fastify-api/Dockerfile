# Multi-stage build for Fastify API
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY .env.production ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fastify -u 1001

# Change ownership to nodejs user
RUN chown -R fastify:nodejs /app
USER fastify

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
