-- CreateTable
CREATE TABLE "weather" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "locationX" INTEGER NOT NULL,
    "locationY" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_weather" (
    "id" TEXT NOT NULL,
    "weatherId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "temperature" TEXT NOT NULL,
    "precipitation" TEXT NOT NULL,
    "weatherState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hourly_weather_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weather_date_idx" ON "weather"("date");

-- CreateIndex
CREATE UNIQUE INDEX "weather_date_locationX_locationY_key" ON "weather"("date", "locationX", "locationY");

-- CreateIndex
CREATE INDEX "hourly_weather_weatherId_idx" ON "hourly_weather"("weatherId");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_weather_weatherId_time_key" ON "hourly_weather"("weatherId", "time");

-- AddForeignKey
ALTER TABLE "hourly_weather" ADD CONSTRAINT "hourly_weather_weatherId_fkey" FOREIGN KEY ("weatherId") REFERENCES "weather"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
