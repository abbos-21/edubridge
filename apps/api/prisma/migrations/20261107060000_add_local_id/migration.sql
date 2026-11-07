-- AlterTable
ALTER TABLE "AdvisorDoc" ADD COLUMN     "localId" TEXT;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "localId" TEXT;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "localId" TEXT;

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "localId" TEXT;

-- AlterTable
ALTER TABLE "CustomEvent" ADD COLUMN     "localId" TEXT;

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "localId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorDoc_userId_localId_key" ON "AdvisorDoc"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_localId_key" ON "Application"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_localId_key" ON "Budget"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_userId_localId_key" ON "ChatThread"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomEvent_userId_localId_key" ON "CustomEvent"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "Interview_userId_localId_key" ON "Interview"("userId", "localId");

