/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[githubId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable: Drop default from updatedAt (safe - won't error if column or default doesn't exist)
-- Skip if updatedAt column doesn't exist yet (it will be added in the next migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;

-- CreateIndex: Create unique index for googleId (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'googleId'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId") WHERE "googleId" IS NOT NULL;
  END IF;
END $$;

-- CreateIndex: Create unique index for githubId (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'githubId'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "User_githubId_key" ON "User"("githubId") WHERE "githubId" IS NOT NULL;
  END IF;
END $$;
