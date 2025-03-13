/*
  Warnings:

  - A unique constraint covering the columns `[uniqueCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Ticket_uniqueCode_key" ON "Ticket"("uniqueCode");
