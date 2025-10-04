/*
  Warnings:

  - A unique constraint covering the columns `[athleteId,tournamentId,presentationNumber]` on the table `AthleteResult` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."AthleteResult_athleteId_tournamentId_key";

-- AlterTable
ALTER TABLE "public"."AthleteResult" ADD COLUMN     "presentationNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "AthleteResult_athleteId_tournamentId_presentationNumber_key" ON "public"."AthleteResult"("athleteId", "tournamentId", "presentationNumber");
