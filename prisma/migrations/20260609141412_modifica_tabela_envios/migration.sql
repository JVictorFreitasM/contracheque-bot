/*
  Warnings:

  - You are about to drop the column `arquivo` on the `Envio` table. All the data in the column will be lost.
  - You are about to drop the column `competencia` on the `Envio` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `Envio` table. All the data in the column will be lost.
  - You are about to drop the column `enviadoEm` on the `Envio` table. All the data in the column will be lost.
  - You are about to drop the column `erro` on the `Envio` table. All the data in the column will be lost.
  - Added the required column `arquivoPdf` to the `Envio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoFuncionario` to the `Envio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeFuncionario` to the `Envio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Envio" DROP COLUMN "arquivo",
DROP COLUMN "competencia",
DROP COLUMN "cpf",
DROP COLUMN "enviadoEm",
DROP COLUMN "erro",
ADD COLUMN     "arquivoPdf" TEXT NOT NULL,
ADD COLUMN     "codigoFuncionario" INTEGER NOT NULL,
ADD COLUMN     "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mensagemErro" TEXT,
ADD COLUMN     "nomeFuncionario" TEXT NOT NULL;
