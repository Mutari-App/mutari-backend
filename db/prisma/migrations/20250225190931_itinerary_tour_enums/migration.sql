-- CreateEnum
CREATE TYPE "DURATION_TYPE" AS ENUM ('HOUR', 'DAY');

-- CreateEnum
CREATE TYPE "TICKET_STATUS" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PAYMENT_STATUS" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TITLE" AS ENUM ('MR', 'MRS', 'MS');

-- CreateEnum
CREATE TYPE "BLOCK_TYPE" AS ENUM ('LOCATION', 'NOTE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "photoProfile" TEXT;

-- CreateTable
CREATE TABLE "Tour" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImage" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "pricePerTicket" DECIMAL(65,30) NOT NULL,
    "duration" INTEGER NOT NULL,
    "durationType" "DURATION_TYPE" NOT NULL,
    "itineraryId" TEXT NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourIncludes" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TourIncludes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTicket" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "status" "TICKET_STATUS" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PAYMENT_STATUS" NOT NULL DEFAULT 'UNPAID',

    CONSTRAINT "TourTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTicketGuest" (
    "id" TEXT NOT NULL,
    "tourTicketId" TEXT NOT NULL,
    "title" "TITLE" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "TourTicketGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "sectionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Hari ke-1',

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "blockType" "BLOCK_TYPE" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMPTZ,
    "endTime" TIMESTAMPTZ,
    "location" TEXT,
    "price" INTEGER DEFAULT 0,
    "photoUrl" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryTag" (
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ItineraryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryAccess" (
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ItineraryAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingItineraryInvite" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "PendingItineraryInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryLike" (
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ItineraryLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tour_id_key" ON "Tour"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TourIncludes_id_key" ON "TourIncludes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TourTicket_id_key" ON "TourTicket"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TourTicketGuest_id_key" ON "TourTicketGuest"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_id_key" ON "Itinerary"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Section_id_key" ON "Section"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Section_itineraryId_sectionNumber_key" ON "Section"("itineraryId", "sectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Block_id_key" ON "Block"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Block_sectionId_position_key" ON "Block"("sectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_id_key" ON "Tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryTag_id_key" ON "ItineraryTag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryTag_itineraryId_tagId_key" ON "ItineraryTag"("itineraryId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryAccess_id_key" ON "ItineraryAccess"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryAccess_itineraryId_userId_key" ON "ItineraryAccess"("itineraryId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingItineraryInvite_id_key" ON "PendingItineraryInvite"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PendingItineraryInvite_email_key" ON "PendingItineraryInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingItineraryInvite_itineraryId_email_key" ON "PendingItineraryInvite"("itineraryId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryLike_id_key" ON "ItineraryLike"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryLike_itineraryId_userId_key" ON "ItineraryLike"("itineraryId", "userId");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourIncludes" ADD CONSTRAINT "TourIncludes_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTicket" ADD CONSTRAINT "TourTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTicket" ADD CONSTRAINT "TourTicket_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTicketGuest" ADD CONSTRAINT "TourTicketGuest_tourTicketId_fkey" FOREIGN KEY ("tourTicketId") REFERENCES "TourTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Itinerary" ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryTag" ADD CONSTRAINT "ItineraryTag_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryTag" ADD CONSTRAINT "ItineraryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryAccess" ADD CONSTRAINT "ItineraryAccess_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryAccess" ADD CONSTRAINT "ItineraryAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingItineraryInvite" ADD CONSTRAINT "PendingItineraryInvite_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryLike" ADD CONSTRAINT "ItineraryLike_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryLike" ADD CONSTRAINT "ItineraryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
