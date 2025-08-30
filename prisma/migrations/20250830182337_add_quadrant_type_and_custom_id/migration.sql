-- CreateEnum
CREATE TYPE "QuadrantType" AS ENUM ('DEPARTAMENTO', 'OFICINA', 'PARQUEO', 'BAULERA');

-- AlterTable
ALTER TABLE "quadrants" ADD COLUMN     "type" "QuadrantType" NOT NULL DEFAULT 'DEPARTAMENTO';
