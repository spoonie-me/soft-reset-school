-- A Program Credential is one Stripe session granting 3 tracks, so the
-- session id must be allowed to repeat across its rows. The old unique index
-- made the 2nd/3rd track insert fail (buyer paid for 3, received 1).
DROP INDEX "bedcoders"."CredentialPurchase_stripeSessionId_key";
CREATE UNIQUE INDEX "CredentialPurchase_stripeSessionId_trackId_key" ON "bedcoders"."CredentialPurchase"("stripeSessionId", "trackId");

-- Include productType so a code_review purchase can't collide with or
-- impersonate a credential for the same track.
DROP INDEX "bedcoders"."CredentialPurchase_userId_trackId_key";
CREATE UNIQUE INDEX "CredentialPurchase_userId_trackId_productType_key" ON "bedcoders"."CredentialPurchase"("userId", "trackId", "productType");
