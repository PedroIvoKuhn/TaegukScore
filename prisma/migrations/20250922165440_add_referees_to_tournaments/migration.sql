/*
  Warnings:

  - You are about to drop the column `tournamentId` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tournamentId` to the `Athlete` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_tournamentId_fkey";

-- AlterTable
ALTER TABLE "public"."Athlete" ADD COLUMN     "tournamentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Category" DROP COLUMN "tournamentId";

-- CreateTable
CREATE TABLE "public"."RefereesInTournament" (
    "refereeId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,

    CONSTRAINT "RefereesInTournament_pkey" PRIMARY KEY ("refereeId","tournamentId")
);

-- CreateTable
CREATE TABLE "public"."CategoryInTournament" (
    "categoryId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,

    CONSTRAINT "CategoryInTournament_pkey" PRIMARY KEY ("categoryId","tournamentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- AddForeignKey
ALTER TABLE "public"."RefereesInTournament" ADD CONSTRAINT "RefereesInTournament_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefereesInTournament" ADD CONSTRAINT "RefereesInTournament_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryInTournament" ADD CONSTRAINT "CategoryInTournament_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryInTournament" ADD CONSTRAINT "CategoryInTournament_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Athlete" ADD CONSTRAINT "Athlete_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
