FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install ALL dependencies (including devDeps for build)
RUN npm install

# Copy prisma schema and generate client
COPY apps/api/prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY apps/api/tsconfig.json ./
COPY apps/api/nest-cli.json ./
COPY apps/api/src ./src

# Build TypeScript
RUN npx tsc -p tsconfig.json

# Create uploads directory
RUN mkdir -p uploads

# Remove devDependencies for smaller image (prisma stays in deps)
RUN npm prune --production

# Re-generate prisma client after prune
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Push database schema and start
CMD sh -c "npx prisma db push --accept-data-loss 2>&1 && echo 'DB ready' && node dist/main"
