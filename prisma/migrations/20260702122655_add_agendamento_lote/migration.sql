-- CreateTable
CREATE TABLE "public"."AgendamentoLote" (
    "id" SERIAL NOT NULL,
    "dataHoraEnvio" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "arquivos" TEXT[],
    "criadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executadoEm" TIMESTAMP(3),

    CONSTRAINT "AgendamentoLote_pkey" PRIMARY KEY ("id")
);
