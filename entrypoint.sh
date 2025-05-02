#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
npx prisma generate
npx prisma db push

# Seed data hozzáadása (ha szükséges)
echo "Adding seed data"
if [ "$NODE_ENV" = "production" ]; then
  # Csak akkor futtassuk a seed parancsot, ha szükséges
  npx prisma db seed || echo "Seeding skipped or failed"
fi

# Alkalmazás indítása
echo "Starting application"
exec npm start 