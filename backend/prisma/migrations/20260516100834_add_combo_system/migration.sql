-- CreateTable
CREATE TABLE "combos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_combos" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "booking_combos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_combos" ADD CONSTRAINT "booking_combos_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_combos" ADD CONSTRAINT "booking_combos_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
