-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestAccountId" TEXT;

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "pendingCodeHash" TEXT,
    "pendingCodeExpiresAt" TIMESTAMP(3),
    "pendingCodeAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_email_key" ON "Guest"("email");

-- CreateIndex
CREATE INDEX "Booking_guestAccountId_idx" ON "Booking"("guestAccountId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestAccountId_fkey" FOREIGN KEY ("guestAccountId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
