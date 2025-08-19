-- CreateEnum
CREATE TYPE "LandingImageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "landing_images" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "status" "LandingImageStatus" NOT NULL DEFAULT 'INACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "landing_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_images_status_idx" ON "landing_images"("status");

-- CreateIndex
CREATE INDEX "landing_images_order_idx" ON "landing_images"("order");

-- CreateIndex
CREATE INDEX "landing_images_created_by_id_idx" ON "landing_images"("created_by_id");

-- AddForeignKey
ALTER TABLE "landing_images" ADD CONSTRAINT "landing_images_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
