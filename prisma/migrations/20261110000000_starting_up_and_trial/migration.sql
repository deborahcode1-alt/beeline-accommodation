-- AlterTable
ALTER TABLE "Host" ADD COLUMN     "startingUpAt" TIMESTAMP(3),
ADD COLUMN     "startingUpEndsAt" TIMESTAMP(3),
ADD COLUMN     "startingUpInvitedAt" TIMESTAMP(3),
ADD COLUMN     "trialUsedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
