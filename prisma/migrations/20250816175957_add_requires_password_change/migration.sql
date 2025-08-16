-- AlterTable
ALTER TABLE "users" ADD COLUMN     "requires_password_change" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT;
