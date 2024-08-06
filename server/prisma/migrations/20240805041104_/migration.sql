/*
  Warnings:

  - The required column `id` was added to the `Favorite` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `History` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "Favorite_userId_slug_key";

-- DropIndex
DROP INDEX "History_userId_slug_chapter_key";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "History" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "History_pkey" PRIMARY KEY ("id");
