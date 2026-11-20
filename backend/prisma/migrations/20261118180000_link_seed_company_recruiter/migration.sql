-- Link default company (TechBolivia S.R.L.) to seed company accounts if unlinked
UPDATE "users"
SET "company_id" = 'a0000000-0000-4000-8000-000000000001'
WHERE "email" IN ('empresa@umssy.test', 'multi.role@umssy.test')
  AND "company_id" IS NULL
  AND EXISTS (
    SELECT 1 FROM "companies" WHERE "id" = 'a0000000-0000-4000-8000-000000000001'
  );

-- Ensure radar company access corresponds to the linked company
INSERT INTO "radar_company_access" ("company_id", "user_id")
SELECT "company_id", "id"
FROM "users"
WHERE "email" IN ('empresa@umssy.test', 'multi.role@umssy.test')
  AND "company_id" IS NOT NULL
ON CONFLICT ("company_id", "user_id") DO NOTHING;
