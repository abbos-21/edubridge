-- CreateTable
CREATE TABLE "PlanSet" (
    "userId" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSet_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "WritingSet" (
    "userId" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingSet_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "PlanSet" ADD CONSTRAINT "PlanSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingSet" ADD CONSTRAINT "WritingSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
