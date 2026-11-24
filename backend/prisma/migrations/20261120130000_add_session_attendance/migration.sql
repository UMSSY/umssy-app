-- AlterTable
ALTER TABLE "event_attendances" ADD COLUMN "session_id" UUID;

-- Backfill: las asistencias existentes pertenecen a la única sesión creada para su taller.
UPDATE "event_attendances" AS a
SET "session_id" = s."id"
FROM "event_registrations" AS r
JOIN "event_sessions" AS s ON s."event_id" = r."event_id"
WHERE a."registration_id" = r."id"
  AND (SELECT COUNT(*) FROM "event_sessions" AS other WHERE other."event_id" = r."event_id") = 1;

-- DropIndex
DROP INDEX "event_attendances_registration_id_key";

-- CreateIndex
CREATE INDEX "event_attendances_session_id_idx" ON "event_attendances"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendances_registration_id_session_id_key" ON "event_attendances"("registration_id", "session_id");

-- AddForeignKey
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "event_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
