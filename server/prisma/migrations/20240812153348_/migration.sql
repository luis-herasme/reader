-- DropForeignKey
ALTER TABLE "ReplacementRule" DROP CONSTRAINT "ReplacementRule_userId_fkey";

-- AddForeignKey
ALTER TABLE "ReplacementRule" ADD CONSTRAINT "ReplacementRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Settings"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
