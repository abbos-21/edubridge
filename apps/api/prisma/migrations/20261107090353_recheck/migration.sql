-- AlterTable
ALTER TABLE "RecheckFinding" ADD COLUMN     "finalUrl" TEXT,
ADD COLUMN     "httpStatus" INTEGER,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "prevCheckedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecheckRun" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "requestedBy" UUID,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'queued',
ADD COLUMN     "trigger" TEXT NOT NULL DEFAULT 'schedule',
ALTER COLUMN "startedAt" DROP NOT NULL,
ALTER COLUMN "startedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "finalUrl" TEXT,
ADD COLUMN     "lastText" TEXT;
