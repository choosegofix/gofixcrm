-- DropForeignKey
ALTER TABLE "CrewMember" DROP CONSTRAINT "CrewMember_userId_fkey";

-- AlterTable
ALTER TABLE "CrewMember" ADD COLUMN     "name" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CrewMember" ADD CONSTRAINT "CrewMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
