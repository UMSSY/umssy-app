-- CreateTable
CREATE TABLE "user_social_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "external_id" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "profile_url" VARCHAR(500),
    "access_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_portfolio_projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "social_account_id" UUID,
    "provider" VARCHAR(20) NOT NULL,
    "repo_name" VARCHAR(150) NOT NULL,
    "repo_url" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "language" VARCHAR(60),
    "stars_count" INTEGER NOT NULL DEFAULT 0,
    "is_owner" BOOLEAN NOT NULL DEFAULT true,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_social_accounts_user_id_idx" ON "user_social_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_user_id_provider_key" ON "user_social_accounts"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_provider_external_id_key" ON "user_social_accounts"("provider", "external_id");

-- CreateIndex
CREATE INDEX "user_portfolio_projects_user_id_display_order_idx" ON "user_portfolio_projects"("user_id", "display_order");

-- CreateIndex
CREATE INDEX "user_portfolio_projects_social_account_id_idx" ON "user_portfolio_projects"("social_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_portfolio_projects_user_id_provider_repo_name_key" ON "user_portfolio_projects"("user_id", "provider", "repo_name");

-- AddForeignKey
ALTER TABLE "user_social_accounts" ADD CONSTRAINT "user_social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_portfolio_projects" ADD CONSTRAINT "user_portfolio_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_portfolio_projects" ADD CONSTRAINT "user_portfolio_projects_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "user_social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
