/*
  Warnings:

  - You are about to drop the `LocationLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LocationLog" DROP CONSTRAINT "LocationLog_userId_fkey";

-- DropTable
DROP TABLE "LocationLog";

-- CreateTable
CREATE TABLE "user_feedback_limits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_feedback_limits_userId_idx" ON "user_feedback_limits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_feedback_limits_userId_date_key" ON "user_feedback_limits"("userId", "date");

-- AddForeignKey
ALTER TABLE "user_feedback_limits" ADD CONSTRAINT "user_feedback_limits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
