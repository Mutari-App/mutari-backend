-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "uniqueCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOnboarded" BOOLEAN NOT NULL DEFAULT false;
