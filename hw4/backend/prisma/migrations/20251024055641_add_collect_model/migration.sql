-- CreateTable
CREATE TABLE "collects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "treasureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "collects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collects_userId_createdAt_idx" ON "collects"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "collects_userId_treasureId_key" ON "collects"("userId", "treasureId");

-- AddForeignKey
ALTER TABLE "collects" ADD CONSTRAINT "collects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collects" ADD CONSTRAINT "collects_treasureId_fkey" FOREIGN KEY ("treasureId") REFERENCES "treasures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
