#!/bin/sh
set -eu

echo "[dev-entrypoint] install deps if needed"
npm install

echo "[dev-entrypoint] prisma generate"
npx prisma generate

echo "[dev-entrypoint] prisma migrate dev"
npx prisma migrate dev --name init --skip-seed || true

echo "[dev-entrypoint] start next dev"
npm run dev
