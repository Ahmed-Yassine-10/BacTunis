#!/usr/bin/env bash
set -e

echo "📦 Installing dependencies..."
cd apps/api
npm install --include=dev

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🏗️ Building with TypeScript..."
npx tsc -p tsconfig.json

echo "🗃️ Running database migrations..."
npx prisma db push --accept-data-loss

echo "✅ Build complete!"
