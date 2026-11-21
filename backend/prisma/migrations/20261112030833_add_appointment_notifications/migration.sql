-- CreateTable
CREATE TABLE "appointment_notification_events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointment_notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_notification_channels" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointment_notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_notification_statuses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointment_notification_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_notifications" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_notification_events_title_key" ON "appointment_notification_events"("title");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_notification_channels_title_key" ON "appointment_notification_channels"("title");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_notification_statuses_title_key" ON "appointment_notification_statuses"("title");

-- CreateIndex
CREATE INDEX "appointment_notifications_recipient_id_idx" ON "appointment_notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "appointment_notifications_event_id_idx" ON "appointment_notifications"("event_id");

-- CreateIndex
CREATE INDEX "appointment_notifications_channel_id_idx" ON "appointment_notifications"("channel_id");

-- CreateIndex
CREATE INDEX "appointment_notifications_status_id_idx" ON "appointment_notifications"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_notifications_appointment_id_recipient_id_event_key" ON "appointment_notifications"("appointment_id", "recipient_id", "event_id", "channel_id");

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "appointment_notification_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "appointment_notification_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "appointment_notification_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
