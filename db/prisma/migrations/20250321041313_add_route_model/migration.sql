-- CreateTable
CREATE TABLE "Route" (
    "sourceBlockId" TEXT NOT NULL,
    "destinationBlockId" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "polyline" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_sourceBlockId_destinationBlockId_key" ON "Route"("sourceBlockId", "destinationBlockId");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_sourceBlockId_fkey" FOREIGN KEY ("sourceBlockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destinationBlockId_fkey" FOREIGN KEY ("destinationBlockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
