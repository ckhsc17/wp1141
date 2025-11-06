/*
  Warnings:

  - A unique constraint covering the columns `[commentId,userId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commentId,userId]` on the table `Repost` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "commentId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "originalCommentId" TEXT;

-- AlterTable
ALTER TABLE "Repost" ADD COLUMN     "commentId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Like_commentId_idx" ON "Like"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_commentId_userId_key" ON "Like"("commentId", "userId");

-- CreateIndex
CREATE INDEX "Post_originalCommentId_idx" ON "Post"("originalCommentId");

-- CreateIndex
CREATE INDEX "Repost_commentId_idx" ON "Repost"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Repost_commentId_userId_key" ON "Repost"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalCommentId_fkey" FOREIGN KEY ("originalCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repost" ADD CONSTRAINT "Repost_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
