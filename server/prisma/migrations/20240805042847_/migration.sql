/*
  Warnings:

  - The primary key for the `Favorite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Favorite` table. All the data in the column will be lost.
  - The primary key for the `History` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `History` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,slug,server]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,slug,chapter,server]` on the table `History` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_pkey",
DROP COLUMN "id";

-- AlterTable
ALTER TABLE "History" DROP CONSTRAINT "History_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_slug_server_key" ON "Favorite"("userId", "slug", "server");

-- CreateIndex
CREATE UNIQUE INDEX "History_userId_slug_chapter_server_key" ON "History"("userId", "slug", "chapter", "server");
