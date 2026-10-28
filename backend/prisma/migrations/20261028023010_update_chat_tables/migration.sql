/*
  Warnings:

  - A unique constraint covering the columns `[event_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "event_id" UUID,
ALTER COLUMN "user_a_id" DROP NOT NULL,
ALTER COLUMN "user_b_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "content" SET DATA TYPE VARCHAR(4000);

-- CreateTable
CREATE TABLE "connection_request_statuses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connection_request_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_types" (
    "id" UUID NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attachment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "type_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_data" BYTEA,
    "url" VARCHAR(1000),
    "thumbnail_url" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_user_blocks" (
    "id" UUID NOT NULL,
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_requests" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connection_request_statuses_title_key" ON "connection_request_statuses"("title");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_types_title_key" ON "attachment_types"("title");

-- CreateIndex
CREATE INDEX "message_attachments_message_id_idx" ON "message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "message_attachments_type_id_idx" ON "message_attachments"("type_id");

-- CreateIndex
CREATE INDEX "chat_user_blocks_blocked_id_idx" ON "chat_user_blocks"("blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_user_blocks_blocker_id_blocked_id_key" ON "chat_user_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "connection_requests_sender_id_idx" ON "connection_requests"("sender_id");

-- CreateIndex
CREATE INDEX "connection_requests_receiver_id_idx" ON "connection_requests"("receiver_id");

-- CreateIndex
CREATE INDEX "connection_requests_receiver_id_status_id_idx" ON "connection_requests"("receiver_id", "status_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_event_id_key" ON "conversations"("event_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "attachment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_user_blocks" ADD CONSTRAINT "chat_user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_user_blocks" ADD CONSTRAINT "chat_user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "connection_request_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Contenido mínimo válido
ALTER TABLE "messages" ADD CONSTRAINT "messages_content_not_empty_check" CHECK ("content" IS NULL OR length(trim("content")) > 0);

-- Un adjunto debe tener file_data (archivo) o url (link)
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachment_content_check" CHECK (
  "file_data" IS NOT NULL OR "url" IS NOT NULL
);

-- Conversación 1:1 o Grupal
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_type_check" CHECK (
  ("event_id" IS NOT NULL AND "user_a_id" IS NULL AND "user_b_id" IS NULL) 
  OR 
  ("event_id" IS NULL AND "user_a_id" IS NOT NULL AND "user_b_id" IS NOT NULL)
);

-- No auto-bloqueo
ALTER TABLE "chat_user_blocks" ADD CONSTRAINT "chat_user_blocks_no_self_block" CHECK ("blocker_id" <> "blocked_id");