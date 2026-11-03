ALTER TABLE "job_offers" ADD COLUMN "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "job_offers" SET "published_at" = "created_at";
