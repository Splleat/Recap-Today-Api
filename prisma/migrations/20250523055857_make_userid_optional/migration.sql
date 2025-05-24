-- DropForeignKey
ALTER TABLE "LocationLog" DROP CONSTRAINT "LocationLog_userId_fkey";

-- AlterTable
ALTER TABLE "LocationLog" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LocationLog" ADD CONSTRAINT "LocationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
