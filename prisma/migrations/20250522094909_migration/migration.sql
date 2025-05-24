/*
  Warnings:

  - You are about to drop the `hourly_weather` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weather` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "hourly_weather" DROP CONSTRAINT "hourly_weather_weatherId_fkey";

-- DropTable
DROP TABLE "hourly_weather";

-- DropTable
DROP TABLE "weather";
