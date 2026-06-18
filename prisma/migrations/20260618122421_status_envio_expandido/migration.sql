/*
  Warnings:

  - The values [PROCESSANDO] on the enum `StatusEnvio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StatusEnvio_new" AS ENUM ('PENDENTE', 'ENVIADO', 'ERRO', 'ERRO_ENVIO', 'ERRO_PDF', 'SEM_TELEFONE', 'FUNCIONARIO_NAO_ENCONTRADO', 'NOME_DIVERGENTE', 'DUPLICADO_HASH', 'DUPLICADO_COMPETENCIA');
ALTER TABLE "public"."Envio" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Envio" ALTER COLUMN "status" TYPE "public"."StatusEnvio_new" USING ("status"::text::"public"."StatusEnvio_new");
ALTER TYPE "public"."StatusEnvio" RENAME TO "StatusEnvio_old";
ALTER TYPE "public"."StatusEnvio_new" RENAME TO "StatusEnvio";
DROP TYPE "public"."StatusEnvio_old";
ALTER TABLE "public"."Envio" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
COMMIT;
