-- CreateTable
CREATE TABLE "event_sessions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_sessions_event_id_idx" ON "event_sessions"("event_id");

-- CreateIndex
CREATE INDEX "event_sessions_starts_at_idx" ON "event_sessions"("starts_at");

-- CreateIndex
CREATE INDEX "event_sessions_ends_at_idx" ON "event_sessions"("ends_at");

-- AddForeignKey
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cada taller existente queda con una sesión equivalente a su fecha y horario actuales (hora de Bolivia).
INSERT INTO "event_sessions" ("id", "event_id", "starts_at", "ends_at", "location", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    "id",
    ("event_date" + "start_time") AT TIME ZONE 'America/La_Paz',
    ("event_date" + "end_time") AT TIME ZONE 'America/La_Paz',
    "location",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "events";
