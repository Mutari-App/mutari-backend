/*
  Warnings:

  - You are about to alter the column `pricePerTicket` on the `Tour` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `totalPrice` on the `TourTicket` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Tour" ALTER COLUMN "pricePerTicket" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "TourTicket" ALTER COLUMN "totalPrice" SET DATA TYPE INTEGER;
