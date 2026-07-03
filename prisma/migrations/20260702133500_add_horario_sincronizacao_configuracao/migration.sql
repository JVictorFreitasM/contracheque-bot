-- AlterTable
ALTER TABLE "public"."Configuracao" ADD COLUMN     "sincronizacao_hora" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "sincronizacao_minuto" INTEGER NOT NULL DEFAULT 0;
