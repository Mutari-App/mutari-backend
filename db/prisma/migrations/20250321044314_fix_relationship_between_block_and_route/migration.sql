/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceBlockId]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[destinationBlockId]` on the table `Route` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Route` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `Route` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Route_sourceBlockId_destinationBlockId_key";

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL,
ADD CONSTRAINT "Route_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Route_id_key" ON "Route"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Route_sourceBlockId_key" ON "Route"("sourceBlockId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_destinationBlockId_key" ON "Route"("destinationBlockId");
