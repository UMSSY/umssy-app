ALTER TABLE "job_offers"
ADD COLUMN "required_careers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "min_experience_years" INTEGER,
ADD COLUMN "other_requirements" TEXT[] DEFAULT ARRAY[]::TEXT[];
