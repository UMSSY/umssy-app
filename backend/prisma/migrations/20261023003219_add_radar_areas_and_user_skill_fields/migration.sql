-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "area_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "user_skills" ADD COLUMN     "evidence_refs" JSONB DEFAULT '[]',
ADD COLUMN     "is_high_relevance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" VARCHAR(20) NOT NULL DEFAULT 'manual',
ADD COLUMN     "verification_status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "radar_areas" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "radar_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radar_areas_name_key" ON "radar_areas"("name");

-- CreateIndex
CREATE INDEX "skills_area_id_idx" ON "skills"("area_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "radar_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
