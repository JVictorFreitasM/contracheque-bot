-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StatusEnvio" ADD VALUE 'REENVIANDO';
ALTER TYPE "public"."StatusEnvio" ADD VALUE 'PROCESSANDOFINALIZADOCANCELADO';

-- AlterTable
ALTER TABLE "public"."Envio" ADD COLUMN     "ultimaTentativaEnvio" TIMESTAMP(3),
ADD COLUMN     "ultimoErro" TEXT;

-- CreateTable
CREATE TABLE "public"."ReprocessamentoLote" (
    "id" SERIAL NOT NULL,
    "competencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReprocessamentoLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Configuracao" (
    "id" SERIAL NOT NULL,
    "evolution_url" TEXT NOT NULL,
    "evolution_instance" TEXT NOT NULL,
    "evolution_api_key" TEXT NOT NULL,
    "intervalo_envio" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);
