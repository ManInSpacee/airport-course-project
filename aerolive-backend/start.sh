#!/bin/sh
set -e

echo "Running DB migrations..."
npx prisma db push

echo "Running seed..."
npx tsx prisma/seed.ts

echo "Starting Airport API..."
exec npx tsx src/index.ts
