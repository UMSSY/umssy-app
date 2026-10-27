-- DropIndex
DROP INDEX "user_cv_file_user_id_key";

-- CreateTable
CREATE TABLE "profile_skill_processing_states" (
    "user_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "input_revision" INTEGER NOT NULL DEFAULT 0,
    "processed_revision" INTEGER,
    "result_version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dictionary_version" VARCHAR(64),

    CONSTRAINT "profile_skill_processing_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "user_cv_file_user_id_idx" ON "user_cv_file"("user_id");

-- AddForeignKey
ALTER TABLE "profile_skill_processing_states" ADD CONSTRAINT "profile_skill_processing_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
