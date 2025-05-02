/*
  Warnings:

  - You are about to drop the column `isGuest` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingEmail` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingMethodId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `shippingMethod` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingMethodId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isGuest",
DROP COLUMN "shippingEmail",
DROP COLUMN "shippingMethodId",
ADD COLUMN     "shippingMethod" TEXT NOT NULL;
