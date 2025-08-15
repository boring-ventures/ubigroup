/*
  Warnings:

  - A unique constraint covering the columns `[floor_id,custom_id]` on the table `quadrants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "quadrants_custom_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "quadrants_floor_id_custom_id_key" ON "quadrants"("floor_id", "custom_id");
