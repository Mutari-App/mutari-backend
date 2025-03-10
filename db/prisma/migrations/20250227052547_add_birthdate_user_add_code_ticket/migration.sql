/*
  Warnings:

  - A unique constraint covering the columns `[uniqueCode]` on the table `Token` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uniqueCode` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN "uniqueCode" TEXT DEFAULT 'temp_value' NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" DATE;


