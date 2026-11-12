-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "cancellation_reason" VARCHAR(300),
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6);
