-- CreateTable
CREATE TABLE "public"."SincronizacaoWK" (
    "id" SERIAL NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "totalRecebidos" INTEGER,
    "totalSincronizados" INTEGER,
    "totalIgnorados" INTEGER,
    "mensagemErro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SincronizacaoWK_pkey" PRIMARY KEY ("id")
);
