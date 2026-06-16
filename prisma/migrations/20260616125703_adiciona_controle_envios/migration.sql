/*
  Warnings:

  - The `status` column on the `Envio` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."StatusEnvio" AS ENUM ('PENDENTE', 'PROCESSANDO', 'ENVIADO', 'ERRO');

-- AlterTable
ALTER TABLE "public"."Envio" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataEnvio" TIMESTAMP(3),
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "tentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."StatusEnvio" NOT NULL DEFAULT 'PENDENTE';
