-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "agreedHostTermsAt" TIMESTAMP(3),
ADD COLUMN     "calendarsSkippedAt" TIMESTAMP(3),
ADD COLUMN     "liveApprovedAt" TIMESTAMP(3);

-- Hosts that are already live stay live: only new hosts go through the Get live checklist.
UPDATE "Host" SET "liveApprovedAt" = NOW(), "agreedHostTermsAt" = NOW();
