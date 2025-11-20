/*
  Warnings:

  - You are about to drop the column `category` on the `SavedItem` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `SavedItem` table. All the data in the column will be lost.
  - You are about to drop the column `journalEntryId` on the `Todo` table. All the data in the column will be lost.
  - You are about to drop the `Insight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JournalEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LineAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LinkMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_userId_fkey";

-- DropForeignKey
ALTER TABLE "ItemTag" DROP CONSTRAINT "ItemTag_savedItemId_fkey";

-- DropForeignKey
ALTER TABLE "ItemTag" DROP CONSTRAINT "ItemTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_savedItemId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "LineAccount" DROP CONSTRAINT "LineAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "LinkMetadata" DROP CONSTRAINT "LinkMetadata_savedItemId_fkey";

-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_journalEntryId_fkey";

-- AlterTable
ALTER TABLE "SavedItem" DROP COLUMN "category",
DROP COLUMN "sourceType",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "journalEntryId";

-- DropTable
DROP TABLE "Insight";

-- DropTable
DROP TABLE "ItemTag";

-- DropTable
DROP TABLE "JournalEntry";

-- DropTable
DROP TABLE "LineAccount";

-- DropTable
DROP TABLE "LinkMetadata";

-- DropTable
DROP TABLE "Tag";

-- DropEnum
DROP TYPE "SavedCategory";

-- DropEnum
DROP TYPE "SavedSourceType";
