-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultTravelMode" TEXT,
ADD COLUMN     "needsSetup" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "userId" DROP NOT NULL;
