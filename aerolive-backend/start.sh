#!/bin/sh
set -e

echo "[1/4] Creating database if not exists..."
npx tsx prisma/create-db.ts
echo "[1/4] Done"

echo "[2/4] Running prisma db push..."
npx prisma db push --skip-generate
echo "[2/4] Done"

echo "[3/4] Running seed..."
npx tsx prisma/seed.ts
echo "[3/4] Done"

echo "[4/4] Starting server..."
exec npx tsx src/index.ts
