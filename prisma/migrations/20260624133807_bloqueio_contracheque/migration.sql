-- AlterEnum
ALTER TYPE "public"."StatusEnvio" ADD VALUE 'BLOQUEADO';

-- AlterTable
ALTER TABLE "public"."Funcionario" ADD COLUMN     "bloqueia_contracheque" BOOLEAN NOT NULL DEFAULT false;
