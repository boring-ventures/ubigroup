-- CreateEnum
CREATE TYPE "QuadrantStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'RESERVED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agent_id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quadrants" (
    "id" TEXT NOT NULL,
    "custom_id" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BOLIVIANOS',
    "exchange_rate" DOUBLE PRECISION,
    "status" "QuadrantStatus" NOT NULL DEFAULT 'AVAILABLE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "floor_id" TEXT NOT NULL,

    CONSTRAINT "quadrants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_agent_id_idx" ON "projects"("agent_id");

-- CreateIndex
CREATE INDEX "projects_agency_id_idx" ON "projects"("agency_id");

-- CreateIndex
CREATE INDEX "floors_project_id_idx" ON "floors"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "quadrants_custom_id_key" ON "quadrants"("custom_id");

-- CreateIndex
CREATE INDEX "quadrants_floor_id_idx" ON "quadrants"("floor_id");

-- CreateIndex
CREATE INDEX "quadrants_status_idx" ON "quadrants"("status");

-- CreateIndex
CREATE INDEX "quadrants_custom_id_idx" ON "quadrants"("custom_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quadrants" ADD CONSTRAINT "quadrants_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
