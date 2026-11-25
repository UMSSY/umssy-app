BEGIN;

ALTER TABLE "refresh_tokens"
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "refresh_tokens"
SET "updated_at" = GREATEST("created_at", "used_at", "revoked_at");

ALTER TABLE "refresh_tokens"
ALTER COLUMN "updated_at" SET NOT NULL;

COMMIT;
