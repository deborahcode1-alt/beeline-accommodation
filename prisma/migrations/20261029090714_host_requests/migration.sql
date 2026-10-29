-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteTokenHash" TEXT;

-- AlterTable
ALTER TABLE "HostEnquiry" ADD COLUMN     "handledAt" TIMESTAMP(3),
ADD COLUMN     "hostId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW';
