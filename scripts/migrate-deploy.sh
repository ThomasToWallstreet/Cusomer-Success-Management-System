#!/bin/sh
set -eu

echo "[migrate] prisma generate"
npx prisma generate

echo "[migrate] prisma migrate deploy"
npx prisma migrate deploy
