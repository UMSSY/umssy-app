-- CreateTable
CREATE TABLE "audit_actions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "audit_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "access_request_id" UUID NOT NULL,
    "request_code" VARCHAR(20) NOT NULL,
    "applicant_name" VARCHAR(201) NOT NULL,
    "applicant_career" VARCHAR(100) NOT NULL,
    "action_id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(201) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "detail" VARCHAR(500),
    "evidence_file_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_validations" (
    "id" UUID NOT NULL,
    "access_request_id" UUID NOT NULL,
    "result" VARCHAR(30) NOT NULL,
    "match_score" SMALLINT,
    "reason" VARCHAR(200),
    "field_results" JSONB,
    "queued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(6),
    "reverted_at" TIMESTAMPTZ(6),
    "reverted_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_validations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_actions_title_key" ON "audit_actions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_number_key" ON "audit_events"("number");

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_number_idx" ON "audit_events"("occurred_at" DESC, "number" DESC);

-- CreateIndex
CREATE INDEX "audit_events_access_request_id_occurred_at_idx" ON "audit_events"("access_request_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_action_id_idx" ON "audit_events"("action_id");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events"("actor_id");

-- CreateIndex
CREATE INDEX "audit_events_evidence_file_id_idx" ON "audit_events"("evidence_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_validations_access_request_id_key" ON "document_validations"("access_request_id");

-- CreateIndex
CREATE INDEX "document_validations_result_idx" ON "document_validations"("result");

-- CreateIndex
CREATE INDEX "document_validations_reverted_by_id_idx" ON "document_validations"("reverted_by_id");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_access_request_id_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "audit_actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_evidence_file_id_fkey" FOREIGN KEY ("evidence_file_id") REFERENCES "files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_access_request_id_fkey" FOREIGN KEY ("access_request_id") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_validations" ADD CONSTRAINT "document_validations_reverted_by_id_fkey" FOREIGN KEY ("reverted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
