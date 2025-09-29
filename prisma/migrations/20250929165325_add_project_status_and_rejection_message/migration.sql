-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "rejection_message" TEXT,
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");
