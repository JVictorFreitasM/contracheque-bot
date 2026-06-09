/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Envio` table. All the data in the column will be lost.
  - You are about to drop the column `dataEnvio` on the `Envio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Envio" DROP COLUMN "createdAt",
DROP COLUMN "dataEnvio",
ADD COLUMN     "dataProcessamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "codigoFuncionario" DROP NOT NULL,
ALTER COLUMN "nomeFuncionario" DROP NOT NULL;
