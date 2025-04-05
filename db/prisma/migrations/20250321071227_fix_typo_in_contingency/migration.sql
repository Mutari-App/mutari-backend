/*
  Warnings:

  - You are about to drop the column `planId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the `ContigencyPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContigencyPlan" DROP CONSTRAINT "ContigencyPlan_itineraryId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_planId_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "planId",
ADD COLUMN     "contingencyPlanId" TEXT;

-- DropTable
DROP TABLE "ContigencyPlan";

-- CreateTable
CREATE TABLE "ContingencyPlan" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContingencyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContingencyPlan_id_key" ON "ContingencyPlan"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ContingencyPlan_itineraryId_title_key" ON "ContingencyPlan"("itineraryId", "title");

-- AddForeignKey
ALTER TABLE "ContingencyPlan" ADD CONSTRAINT "ContingencyPlan_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_contingencyPlanId_fkey" FOREIGN KEY ("contingencyPlanId") REFERENCES "ContingencyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
