/*
  Warnings:

  - A unique constraint covering the columns `[hashArquivo]` on the table `Envio` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,competencia]` on the table `Envio` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Envio" ADD COLUMN     "competencia" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "hashArquivo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Envio_hashArquivo_key" ON "public"."Envio"("hashArquivo");

-- CreateIndex
CREATE UNIQUE INDEX "Envio_cpf_competencia_key" ON "public"."Envio"("cpf", "competencia");
