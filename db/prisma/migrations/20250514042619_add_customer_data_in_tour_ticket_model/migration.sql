/*
  Warnings:

  - Added the required column `customerEmail` to the `TourTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerFirstName` to the `TourTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerLastName` to the `TourTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhoneNumber` to the `TourTicket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerTitle` to the `TourTicket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TourTicket" ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerFirstName" TEXT NOT NULL,
ADD COLUMN     "customerLastName" TEXT NOT NULL,
ADD COLUMN     "customerPhoneNumber" TEXT NOT NULL,
ADD COLUMN     "customerTitle" "TITLE" NOT NULL;
