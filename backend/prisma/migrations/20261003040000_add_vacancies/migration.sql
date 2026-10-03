CREATE TABLE "vacancies" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "modality" TEXT,
    "required_skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "academic_requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "other_requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vacancies_is_active_created_at_idx" ON "vacancies"("is_active", "created_at");
