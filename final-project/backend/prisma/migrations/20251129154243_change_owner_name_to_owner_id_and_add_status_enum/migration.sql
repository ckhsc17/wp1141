/*
  Warnings:

  - You are about to drop the column `ownerName` on the `Event` table. All the data in the column will be lost.
  - The `status` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `ownerId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'ended');

-- DropIndex
DROP INDEX "Event_ownerName_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "ownerName",
ADD COLUMN     "ownerId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'upcoming';

-- CreateIndex
CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");
