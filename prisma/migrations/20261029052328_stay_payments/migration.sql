-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "amountPaid" DOUBLE PRECISION,
ADD COLUMN     "cardSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "transferNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "acceptsCardPayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankBsb" TEXT;
