-- AlterTable
ALTER TABLE "ItineraryReminder" ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "startDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tripName" TEXT;
