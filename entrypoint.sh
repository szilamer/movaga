#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
npx prisma generate
npx prisma db push

# Seed data hozzáadása megfelelő környezeti változókkal
echo "Adding seed data"
NODE_ENV=production npx prisma db seed -- --verbose || echo "Seeding failed but continuing anyway"

# Alkalmazás indítása
echo "Starting application"
exec npm start 