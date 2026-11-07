/*
  Warnings:

  - The `status` column on the `CatalogueRevision` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RevisionStatus" AS ENUM ('draft', 'in_review', 'rejected', 'published', 'superseded');

-- AlterTable
ALTER TABLE "CatalogueRevision" DROP COLUMN "status",
ADD COLUMN     "status" "RevisionStatus" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "DemoSnapshot" ADD COLUMN     "lang" TEXT,
ADD COLUMN     "mock" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CatalogueMark" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" UUID,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueMark_pkey" PRIMARY KEY ("entityType","entityId")
);

-- CreateIndex
CREATE INDEX "CatalogueRevision_status_idx" ON "CatalogueRevision"("status");
