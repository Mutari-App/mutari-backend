-- CreateTable
CREATE TABLE "TourView" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourView_id_key" ON "TourView"("id");

-- CreateIndex
CREATE INDEX "TourView_userId_viewedAt_idx" ON "TourView"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TourView_userId_tourId_key" ON "TourView"("userId", "tourId");

-- AddForeignKey
ALTER TABLE "TourView" ADD CONSTRAINT "TourView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourView" ADD CONSTRAINT "TourView_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
