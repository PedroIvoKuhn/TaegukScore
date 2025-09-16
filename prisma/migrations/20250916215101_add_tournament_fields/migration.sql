/*
  Warnings:

  - You are about to drop the column `descricao` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `localizacao` on the `Tournament` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Tournament" DROP COLUMN "descricao",
DROP COLUMN "localizacao",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT;
