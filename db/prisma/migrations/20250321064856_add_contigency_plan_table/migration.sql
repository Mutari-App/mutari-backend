-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "ContigencyPlan" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContigencyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContigencyPlan_id_key" ON "ContigencyPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ContigencyPlan_itineraryId_title_key" ON "ContigencyPlan"("itineraryId", "title");

-- AddForeignKey
ALTER TABLE "ContigencyPlan" ADD CONSTRAINT "ContigencyPlan_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ContigencyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
