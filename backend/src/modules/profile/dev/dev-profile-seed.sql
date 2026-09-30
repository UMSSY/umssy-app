-- Development data for Epic 2 (profile). Safe to run several times.
-- Run from backend/ with:
--   pnpm exec prisma db execute --file src/modules/profile/dev/dev-profile-seed.sql

INSERT INTO "cities" ("id", "title", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Cochabamba', NOW(), NOW()),
  (gen_random_uuid(), 'La Paz', NOW(), NOW()),
  (gen_random_uuid(), 'El Alto', NOW(), NOW()),
  (gen_random_uuid(), 'Santa Cruz de la Sierra', NOW(), NOW()),
  (gen_random_uuid(), 'Oruro', NOW(), NOW()),
  (gen_random_uuid(), 'Potosí', NOW(), NOW()),
  (gen_random_uuid(), 'Sucre', NOW(), NOW()),
  (gen_random_uuid(), 'Tarija', NOW(), NOW()),
  (gen_random_uuid(), 'Trinidad', NOW(), NOW()),
  (gen_random_uuid(), 'Cobija', NOW(), NOW()),
  (gen_random_uuid(), 'Quillacollo', NOW(), NOW()),
  (gen_random_uuid(), 'Sacaba', NOW(), NOW())
ON CONFLICT ("title") DO NOTHING;

-- Approved graduate used by the frontend while the auth module is pending.
-- Its id must match NEXT_PUBLIC_DEV_USER_ID in frontend/.env (see README.md)
INSERT INTO "users" ("id", "first_name", "last_name", "email", "created_at", "updated_at")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Valeria',
  'Quispe',
  'valeria.quispe@est.umss.edu',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
