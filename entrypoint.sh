#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
npx prisma generate
npx prisma db push

# Seed data hozzáadása (mindig futtassuk produkcióban is)
echo "Adding seed data"
npx prisma db seed

# Alkalmazás indítása
echo "Starting application"
exec npm start 