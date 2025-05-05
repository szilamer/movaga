#!/bin/bash

# Generate Prisma client
npx prisma generate

# Apply migrations from SQL files directly instead of using prisma migrate
echo "Applying migration to add shippingEmail column..."
npx prisma db execute --file ./prisma/migrations/20250505130246_add_shipping_email/migration.sql

# Apply any remaining schema changes
echo "Applying any remaining schema changes..."
npx prisma db push

echo "Database migration completed successfully" 