-- CreateTable
CREATE TABLE "ItineraryView" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryView_id_key" ON "ItineraryView"("id");

-- CreateIndex
CREATE INDEX "ItineraryView_userId_viewedAt_idx" ON "ItineraryView"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryView_userId_itineraryId_key" ON "ItineraryView"("userId", "itineraryId");

-- AddForeignKey
ALTER TABLE "ItineraryView" ADD CONSTRAINT "ItineraryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryView" ADD CONSTRAINT "ItineraryView_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
