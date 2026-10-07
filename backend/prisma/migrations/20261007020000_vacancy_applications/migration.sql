-- CreateTable
CREATE TABLE "application_statuses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancy_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vacancy_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacancy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "previous_status_id" UUID,
    "new_status_id" UUID NOT NULL,
    "changed_by_id" UUID,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_vacancies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vacancy_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_statuses_name_key" ON "application_statuses"("name");

-- CreateIndex
CREATE INDEX "vacancy_applications_vacancy_id_idx" ON "vacancy_applications"("vacancy_id");

-- CreateIndex
CREATE INDEX "vacancy_applications_status_id_idx" ON "vacancy_applications"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "vacancy_applications_user_id_vacancy_id_key" ON "vacancy_applications"("user_id", "vacancy_id");

-- CreateIndex
CREATE INDEX "application_histories_application_id_changed_at_idx" ON "application_histories"("application_id", "changed_at");

-- CreateIndex
CREATE INDEX "application_histories_previous_status_id_idx" ON "application_histories"("previous_status_id");

-- CreateIndex
CREATE INDEX "application_histories_new_status_id_idx" ON "application_histories"("new_status_id");

-- CreateIndex
CREATE INDEX "application_histories_changed_by_id_idx" ON "application_histories"("changed_by_id");

-- CreateIndex
CREATE INDEX "saved_vacancies_vacancy_id_idx" ON "saved_vacancies"("vacancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_vacancies_user_id_vacancy_id_key" ON "saved_vacancies"("user_id", "vacancy_id");

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_histories" ADD CONSTRAINT "application_histories_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "vacancy_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_histories" ADD CONSTRAINT "application_histories_previous_status_id_fkey" FOREIGN KEY ("previous_status_id") REFERENCES "application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_histories" ADD CONSTRAINT "application_histories_new_status_id_fkey" FOREIGN KEY ("new_status_id") REFERENCES "application_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_histories" ADD CONSTRAINT "application_histories_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_vacancies" ADD CONSTRAINT "saved_vacancies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_vacancies" ADD CONSTRAINT "saved_vacancies_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Estados iniciales del flujo de postulacion.
INSERT INTO application_statuses (name) VALUES ('submitted'), ('under_review'), ('accepted'), ('rejected');
