-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pointValue" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discountValidUntil" TIMESTAMP(3);
