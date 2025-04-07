-- CreateEnum
CREATE TYPE "REMINDER_OPTION" AS ENUM ('NONE', 'TEN_MINUTES_BEFORE', 'ONE_HOUR_BEFORE', 'ONE_DAY_BEFORE');

-- CreateTable
CREATE TABLE "ItineraryReminder" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reminderOption" "REMINDER_OPTION" NOT NULL,

    CONSTRAINT "ItineraryReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryReminder_id_key" ON "ItineraryReminder"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryReminder_itineraryId_key" ON "ItineraryReminder"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryReminder_itineraryId_email_key" ON "ItineraryReminder"("itineraryId", "email");

-- AddForeignKey
ALTER TABLE "ItineraryReminder" ADD CONSTRAINT "ItineraryReminder_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
