/*
  Warnings:

  - Added the required column `shippingEmail` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- First add the column as nullable
ALTER TABLE "Order" ADD COLUMN "shippingEmail" TEXT;

-- Update existing records with an email (either from the user or a fallback)
UPDATE "Order" SET "shippingEmail" = COALESCE(
  (SELECT "email" FROM "users" WHERE "users"."id" = "Order"."userId"),
  'info@movaga.hu'
);

-- Now make the column required
ALTER TABLE "Order" ALTER COLUMN "shippingEmail" SET NOT NULL;
