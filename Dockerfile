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

# Remove devDependencies for smaller image
RUN npm prune --production

# Expose port
EXPOSE 3001

# Push database schema and start
CMD npx prisma db push --accept-data-loss && node dist/main
