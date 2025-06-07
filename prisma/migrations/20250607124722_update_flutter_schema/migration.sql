/*
  Warnings:

  - You are about to drop the column `color` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `schedules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,date]` on the table `diaries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `photos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTimeHour` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTimeMinute` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTimeHour` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTimeMinute` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_diaryId_fkey";

-- DropIndex
DROP INDEX "appusages_userId_idx";

-- DropIndex
DROP INDEX "checklists_userId_idx";

-- DropIndex
DROP INDEX "schedules_userId_idx";

-- AlterTable
ALTER TABLE "appusages" ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "dueDate" SET DATA TYPE TEXT,
ALTER COLUMN "completedDate" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "diaries" ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photoPaths" TEXT;

-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "color",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "colorValue" INTEGER,
ADD COLUMN     "endTimeHour" INTEGER NOT NULL,
ADD COLUMN     "endTimeMinute" INTEGER NOT NULL,
ADD COLUMN     "isSynced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTimeHour" INTEGER NOT NULL,
ADD COLUMN     "startTimeMinute" INTEGER NOT NULL,
ALTER COLUMN "selectedDate" SET DATA TYPE TEXT,
ALTER COLUMN "isRoutine" SET DEFAULT false,
ALTER COLUMN "hasAlarm" SET DEFAULT false;

-- CreateTable
CREATE TABLE "emotion_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "emotionType" TEXT NOT NULL,
    "notes" TEXT,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "address" TEXT,
    "timestamp" TEXT NOT NULL,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "stepCount" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "feedbackText" TEXT NOT NULL,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emotion_records_userId_date_idx" ON "emotion_records"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "emotion_records_userId_date_hour_key" ON "emotion_records"("userId", "date", "hour");

-- CreateIndex
CREATE INDEX "location_logs_userId_timestamp_idx" ON "location_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "steps_userId_idx" ON "steps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "steps_userId_date_key" ON "steps"("userId", "date");

-- CreateIndex
CREATE INDEX "ai_feedback_userId_date_idx" ON "ai_feedback"("userId", "date");

-- CreateIndex
CREATE INDEX "appusages_userId_date_idx" ON "appusages"("userId", "date");

-- CreateIndex
CREATE INDEX "appusages_userId_packageName_idx" ON "appusages"("userId", "packageName");

-- CreateIndex
CREATE INDEX "blacklisted_tokens_expiresAt_idx" ON "blacklisted_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "checklists_userId_isChecked_idx" ON "checklists"("userId", "isChecked");

-- CreateIndex
CREATE INDEX "checklists_userId_dueDate_idx" ON "checklists"("userId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "diaries_userId_date_key" ON "diaries"("userId", "date");

-- CreateIndex
CREATE INDEX "photos_userId_idx" ON "photos"("userId");

-- CreateIndex
CREATE INDEX "schedules_userId_selectedDate_idx" ON "schedules"("userId", "selectedDate");

-- CreateIndex
CREATE INDEX "schedules_userId_dayOfWeek_idx" ON "schedules"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "schedules_userId_isRoutine_idx" ON "schedules"("userId", "isRoutine");

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "diaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotion_records" ADD CONSTRAINT "emotion_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
