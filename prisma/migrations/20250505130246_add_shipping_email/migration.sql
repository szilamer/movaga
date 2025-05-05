/*
  Warnings:

  - Added the required column `shippingEmail` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippingEmail" TEXT;

-- Frissítsük a meglévő rendeléseket egy alapértelmezett email címmel
UPDATE "Order" SET "shippingEmail" = COALESCE(
  (SELECT "email" FROM "users" WHERE "users"."id" = "Order"."userId"),
  'no-email@movaga.hu'
);

-- Most tegyük a mezőt kötelezővé (NOT NULL)
ALTER TABLE "Order" ALTER COLUMN "shippingEmail" SET NOT NULL;
