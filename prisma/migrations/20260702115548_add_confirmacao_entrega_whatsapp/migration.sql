-- AlterTable
ALTER TABLE "public"."Envio" ADD COLUMN     "dataEntregaWhatsapp" TIMESTAMP(3),
ADD COLUMN     "dataLeituraWhatsapp" TIMESTAMP(3),
ADD COLUMN     "statusEntregaWhatsapp" TEXT,
ADD COLUMN     "whatsappMessageId" TEXT;

-- CreateIndex
CREATE INDEX "Envio_whatsappMessageId_idx" ON "public"."Envio"("whatsappMessageId");
