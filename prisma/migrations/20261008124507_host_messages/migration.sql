-- CreateTable
CREATE TABLE "HostMessage" (
    "id" TEXT NOT NULL,
    "hostId" TEXT,
    "listingId" TEXT,
    "listingName" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HostMessage" ADD CONSTRAINT "HostMessage_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE SET NULL ON UPDATE CASCADE;
