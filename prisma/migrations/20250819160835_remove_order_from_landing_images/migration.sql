/*
  Warnings:

  - You are about to drop the column `order` on the `landing_images` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "landing_images_order_idx";

-- AlterTable
ALTER TABLE "landing_images" DROP COLUMN "order";
