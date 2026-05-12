#!/bin/sh
set -e

echo "Starting Airport API..."
exec npx tsx src/index.ts
