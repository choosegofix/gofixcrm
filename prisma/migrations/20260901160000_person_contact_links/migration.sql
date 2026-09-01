-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "CrewMember" DROP COLUMN "name",
ADD COLUMN     "contactId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billingContactId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contact_userId_key" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewMember_contactId_key" ON "CrewMember"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_billingContactId_key" ON "Invoice"("billingContactId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingContactId_fkey" FOREIGN KEY ("billingContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
