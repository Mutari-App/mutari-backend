/*
  Warnings:

  - You are about to drop the column `uniqueCode` on the `Token` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uniqueCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueCode` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "uniqueCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "uniqueCode";

