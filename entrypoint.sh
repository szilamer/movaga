#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
npx prisma generate
npx prisma db push

# Seed data hozzáadása megfelelő környezeti változókkal és CommonJS módban
echo "Adding seed data"
NODE_ENV=production npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seeding failed but continuing anyway"

# Alkalmazás indítása
echo "Starting application"
exec npm start 