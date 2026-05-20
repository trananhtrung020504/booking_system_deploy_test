/*
  Warnings:

  - You are about to drop the column `seats` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `seat_holds` table. All the data in the column will be lost.
  - You are about to drop the column `screenName` on the `shows` table. All the data in the column will be lost.
  - You are about to drop the column `seatLayout` on the `shows` table. All the data in the column will be lost.
  - Added the required column `screenId` to the `shows` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('STANDARD', 'VIP', 'SWEETBOX');

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "seats";

-- AlterTable
ALTER TABLE "seat_holds" DROP COLUMN "seats";

-- AlterTable
ALTER TABLE "shows" DROP COLUMN "screenName",
DROP COLUMN "seatLayout",
ADD COLUMN     "screenId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "screens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theaterId" TEXT NOT NULL,
    "rows" INTEGER NOT NULL DEFAULT 10,
    "cols" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "column" INTEGER NOT NULL,
    "type" "SeatType" NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SeatToSeatHold" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SeatToSeatHold_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BookingToSeat" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BookingToSeat_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "seats_screenId_row_column_key" ON "seats"("screenId", "row", "column");

-- CreateIndex
CREATE INDEX "_SeatToSeatHold_B_index" ON "_SeatToSeatHold"("B");

-- CreateIndex
CREATE INDEX "_BookingToSeat_B_index" ON "_BookingToSeat"("B");

-- CreateIndex
CREATE INDEX "shows_screenId_idx" ON "shows"("screenId");

-- AddForeignKey
ALTER TABLE "screens" ADD CONSTRAINT "screens_theaterId_fkey" FOREIGN KEY ("theaterId") REFERENCES "theaters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shows" ADD CONSTRAINT "shows_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeatToSeatHold" ADD CONSTRAINT "_SeatToSeatHold_A_fkey" FOREIGN KEY ("A") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SeatToSeatHold" ADD CONSTRAINT "_SeatToSeatHold_B_fkey" FOREIGN KEY ("B") REFERENCES "seat_holds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingToSeat" ADD CONSTRAINT "_BookingToSeat_A_fkey" FOREIGN KEY ("A") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingToSeat" ADD CONSTRAINT "_BookingToSeat_B_fkey" FOREIGN KEY ("B") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
