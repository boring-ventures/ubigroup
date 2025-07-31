/*
  Warnings:

  - You are about to drop the column `email` on the `agencies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[custom_id]` on the table `properties` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BOLIVIANOS', 'DOLLARS');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'ANTICRÉTICO';

-- AlterTable
ALTER TABLE "agencies" DROP COLUMN "email";

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'BOLIVIANOS',
ADD COLUMN     "custom_id" TEXT,
ADD COLUMN     "exchange_rate" DOUBLE PRECISION,
ADD COLUMN     "google_maps_url" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "municipality" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "properties_custom_id_key" ON "properties"("custom_id");

-- CreateIndex
CREATE INDEX "properties_custom_id_idx" ON "properties"("custom_id");
