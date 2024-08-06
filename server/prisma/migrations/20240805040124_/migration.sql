/*
  Warnings:

  - Added the required column `chapter` to the `Favorite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `server` to the `Favorite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `server` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "chapter" TEXT NOT NULL,
ADD COLUMN     "server" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "History" ADD COLUMN     "server" TEXT NOT NULL;
