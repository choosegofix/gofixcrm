-- Add new columns as nullable first so existing rows aren't lost
ALTER TABLE "Contact" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "leadId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "crewId" TEXT;

-- A contact no longer has to belong to a client (general/vendor contacts)
ALTER TABLE "Contact" ALTER COLUMN "clientId" DROP NOT NULL;

-- Backfill companyId for existing client-linked contacts from their client
UPDATE "Contact" c
SET "companyId" = cl."companyId"
FROM "Client" cl
WHERE c."clientId" = cl."id" AND c."companyId" IS NULL;

-- Now that every existing row has a value, enforce it going forward
ALTER TABLE "Contact" ALTER COLUMN "companyId" SET NOT NULL;

-- One contact per lead / crew
CREATE UNIQUE INDEX "Contact_leadId_key" ON "Contact"("leadId");
CREATE UNIQUE INDEX "Contact_crewId_key" ON "Contact"("crewId");

-- Foreign keys
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_crewId_fkey" FOREIGN KEY ("crewId") REFERENCES "Crew"("id") ON DELETE CASCADE ON UPDATE CASCADE;
