# ==============================================================================
# Node.js Express Backend Service
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Expose backend REST API port
EXPOSE 5000

# Health check using native Node.js 18+ fetch API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Express server
CMD ["node", "index.js"]
