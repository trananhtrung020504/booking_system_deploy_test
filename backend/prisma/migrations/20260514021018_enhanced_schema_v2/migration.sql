/*
  Warnings:

  - You are about to drop the column `date` on the `shows` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `shows` table. All the data in the column will be lost.
  - Changed the type of `duration` on the `movies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `endTime` to the `shows` table without a default value. This is not possible if the table is not empty.
  - Added the required column `screenName` to the `shows` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `startTime` on the `shows` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "convenience" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "trailerUrl" TEXT,
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shows" DROP COLUMN "date",
DROP COLUMN "location",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "screenName" TEXT NOT NULL,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "seat_holds" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seats" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_holds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seat_holds_showId_idx" ON "seat_holds"("showId");

-- CreateIndex
CREATE INDEX "seat_holds_expiresAt_idx" ON "seat_holds"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "seat_holds_showId_userId_key" ON "seat_holds"("showId", "userId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_showId_idx" ON "bookings"("showId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "movies_isActive_idx" ON "movies"("isActive");

-- CreateIndex
CREATE INDEX "movies_releaseDate_idx" ON "movies"("releaseDate");

-- CreateIndex
CREATE INDEX "shows_movieId_idx" ON "shows"("movieId");

-- CreateIndex
CREATE INDEX "shows_theaterId_idx" ON "shows"("theaterId");

-- CreateIndex
CREATE INDEX "shows_startTime_idx" ON "shows"("startTime");

-- CreateIndex
CREATE INDEX "shows_movieId_startTime_idx" ON "shows"("movieId", "startTime");

-- CreateIndex
CREATE INDEX "theaters_city_idx" ON "theaters"("city");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
