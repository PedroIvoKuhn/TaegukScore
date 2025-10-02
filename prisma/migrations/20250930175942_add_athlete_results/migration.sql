-- CreateTable
CREATE TABLE "public"."AthleteResult" (
    "id" SERIAL NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "precisionAvg" DOUBLE PRECISION NOT NULL,
    "presentationAvg" DOUBLE PRECISION NOT NULL,
    "athleteId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,

    CONSTRAINT "AthleteResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AthleteResult_athleteId_tournamentId_key" ON "public"."AthleteResult"("athleteId", "tournamentId");

-- AddForeignKey
ALTER TABLE "public"."AthleteResult" ADD CONSTRAINT "AthleteResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "public"."Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AthleteResult" ADD CONSTRAINT "AthleteResult_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
