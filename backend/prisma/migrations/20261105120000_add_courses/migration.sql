-- Courses: a domain can be sold on its own. Additive in effect on live data.
-- Existing CredentialPurchase rows get domainId '' (a track purchase), so the
-- old uniqueness still holds for them. New unique indexes are created before
-- the old ones are dropped, so there is no moment without a guard.

-- AlterTable
ALTER TABLE "bedcoders"."CompetencyDomain" ADD COLUMN     "courseBlurb" TEXT,
ADD COLUMN     "courseForSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "courseOrder" INTEGER,
ADD COLUMN     "courseSlug" TEXT,
ADD COLUMN     "courseTitle" TEXT,
ADD COLUMN     "seedKey" TEXT;

-- AlterTable
ALTER TABLE "bedcoders"."CredentialPurchase" ADD COLUMN     "domainId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyDomain_courseSlug_key" ON "bedcoders"."CompetencyDomain"("courseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyDomain_seedKey_key" ON "bedcoders"."CompetencyDomain"("seedKey");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialPurchase_stripeSessionId_trackId_domainId_key" ON "bedcoders"."CredentialPurchase"("stripeSessionId", "trackId", "domainId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialPurchase_userId_trackId_productType_domainId_key" ON "bedcoders"."CredentialPurchase"("userId", "trackId", "productType", "domainId");

-- DropIndex
DROP INDEX "bedcoders"."CredentialPurchase_stripeSessionId_trackId_key";

-- DropIndex
DROP INDEX "bedcoders"."CredentialPurchase_userId_trackId_productType_key";
