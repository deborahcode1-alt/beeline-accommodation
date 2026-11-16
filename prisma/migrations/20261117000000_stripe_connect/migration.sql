-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cardTermsAgreedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Host_stripeAccountId_key" ON "Host"("stripeAccountId");
