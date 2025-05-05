#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
# Prisma Client generálása
npx prisma generate

# Közvetlenül futtatjuk az SQL migrációt a shippingEmail mezőhöz
echo "Applying shippingEmail migration directly with SQL..."
npx prisma db execute --url="${DATABASE_URL}" --stdin <<SQL
-- Először hozzáadjuk a mezőt mint nullable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingEmail" TEXT;

-- Frissítjük a meglévő rekordokat
UPDATE "Order" SET "shippingEmail" = COALESCE(
  (SELECT "email" FROM "users" WHERE "users"."id" = "Order"."userId"),
  'info@movaga.hu'
) WHERE "shippingEmail" IS NULL;

-- Most kötelezővé tesszük a mezőt
ALTER TABLE "Order" ALTER COLUMN "shippingEmail" SET NOT NULL;
SQL

# Alkalmazzuk a többi sémamódosítást
echo "Applying remaining schema changes..."
npx prisma db push

# Seed data hozzáadása megfelelő környezeti változókkal és CommonJS módban
echo "Adding seed data"
NODE_ENV=production npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seeding failed but continuing anyway"

# Alkalmazás indítása
echo "Starting application"
exec npm start 