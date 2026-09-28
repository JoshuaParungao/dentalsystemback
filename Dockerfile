# Production Dockerfile for O'Clear Dental Clinic
# Optimized for Coolify on Hostinger VPS

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy application files
COPY package.json ./
COPY server.js ./
COPY styles.css ./
COPY script.js ./
COPY index.html ./
COPY dashboard.html ./
COPY login.html ./
COPY paymongo-checkout.html ./
COPY config.json ./
COPY images/ ./images/
COPY data/ ./data/

# Expose default port
EXPOSE 3000

# Healthcheck to let Coolify verify container health
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/services || exit 1

# Start the Node.js server
CMD ["node", "server.js"]
