CREATE TABLE "mentor_capacity_settings" (
  "id" INTEGER NOT NULL,
  "percentage" INTEGER NOT NULL DEFAULT 40,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mentor_capacity_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentor_capacity_settings_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "mentor_capacity_settings_percentage_check" CHECK ("percentage" BETWEEN 1 AND 100)
);

INSERT INTO "mentor_capacity_settings" ("id", "percentage")
VALUES (1, 40);
