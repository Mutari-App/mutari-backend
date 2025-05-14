-- CreateTable
CREATE TABLE "ChangeEmailTicket" (
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uniqueCode" TEXT,
    "newEmail" TEXT NOT NULL,

    CONSTRAINT "ChangeEmailTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChangeEmailTicket_id_key" ON "ChangeEmailTicket"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeEmailTicket_uniqueCode_key" ON "ChangeEmailTicket"("uniqueCode");

-- AddForeignKey
ALTER TABLE "ChangeEmailTicket" ADD CONSTRAINT "ChangeEmailTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
