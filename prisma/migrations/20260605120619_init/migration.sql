-- CreateTable
CREATE TABLE "public"."Funcionario" (
    "cpf" TEXT NOT NULL,
    "codigo" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("cpf")
);

-- CreateTable
CREATE TABLE "public"."Envio" (
    "id" SERIAL NOT NULL,
    "cpf" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "erro" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Envio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_codigo_key" ON "public"."Funcionario"("codigo");
