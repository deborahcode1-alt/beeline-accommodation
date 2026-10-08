-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'FARM_STAY', 'BOUTIQUE_HOTEL', 'HOUSE');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "propertyType" "PropertyType" NOT NULL DEFAULT 'HOUSE';
