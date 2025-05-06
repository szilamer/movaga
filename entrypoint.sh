#!/bin/sh
set -e

# Adatbázis migrálása
echo "Running database migrations"
# Prisma Client generálása
npx prisma generate

# Egyszerű, de robusztus megközelítés:
# Először próbáljuk meg a db push-t, ami teljesen létrehozza a sémát ha szükséges
echo "Initializing database with db push..."
npx prisma db push --accept-data-loss || {
  echo "Failed to initialize database with db push. Trying direct SQL migration..."
  
  # Ellenőrizzük az adatbázis-kapcsolatot
  npx prisma db execute --url="${DATABASE_URL}" --stdin <<SQL
  SELECT 1;
SQL
  
  echo "Database connection successful. Creating schema..."
  # Közvetlenül futtatjuk az SQL migrációt
  npx prisma db execute --url="${DATABASE_URL}" --stdin <<SQL
  -- Tábla létrehozása, ha nem létezik
  CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "barionPaymentId" TEXT,
    "shippingAddress" TEXT,
    "billingAddress" TEXT,
    "shippingMethod" TEXT,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "shippingEmail" TEXT NOT NULL DEFAULT 'info@movaga.hu',
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
  );
SQL
  
  # Alkalmazzuk a teljes séma push-t
  echo "Order table created. Applying full schema..."
  npx prisma db push --accept-data-loss
}

# Seed data hozzáadása megfelelő környezeti változókkal és CommonJS módban
echo "Adding seed data"
NODE_ENV=production npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seeding failed but continuing anyway"

# Email template-ek hozzáadása
echo "Adding email templates"
NODE_ENV=production npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' prisma/seed-email-templates.ts || echo "Email template seeding failed but continuing anyway"

# Alkalmazás indítása
echo "Starting application"
exec npm start 