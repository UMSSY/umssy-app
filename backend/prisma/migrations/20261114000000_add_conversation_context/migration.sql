ALTER TABLE "conversations" ADD COLUMN "context_type" VARCHAR(50),
ADD COLUMN "context_id" UUID;

DROP INDEX IF EXISTS "conversations_user_a_id_user_b_id_key";
CREATE UNIQUE INDEX "conversations_user_a_id_user_b_id_key" ON "conversations"("user_a_id", "user_b_id") WHERE "context_id" IS NULL AND "event_id" IS NULL;
CREATE UNIQUE INDEX "conversations_context_id_key" ON "conversations"("context_id");
CREATE INDEX "conversations_user_a_id_user_b_id_idx" ON "conversations"("user_a_id", "user_b_id");
CREATE INDEX "conversations_context_type_context_id_idx" ON "conversations"("context_type", "context_id");
