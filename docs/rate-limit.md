# Rate Limiting

## Não há rate limit configurado neste backend

Diferente do IdP (que limita `POST /login`), **nenhum endpoint deste backend tem rate limit** -
nem `/auth/*`, nem `/api/*`, nem o webhook da Evolution API. Não há `express-rate-limit` (ou
equivalente) instalado neste projeto.

Isso vale também pra `/api/uploads` (sem limite de tamanho de arquivo configurado no `multer` -
só filtro de mimetype) e `/api/webhooks/evolution` (potencialmente chamado com alta frequência
pela Evolution API a cada atualização de status de mensagem).

## Se for adicionar no futuro

Os candidatos mais óbvios, por ordem de risco:

1. `POST /api/uploads` - upload de arquivos, sem limite de tamanho nem de frequência.
2. `POST /api/webhooks/evolution` - endpoint público (sem `requireAuth`), só protegido por um
   token opcional em query string.
3. `POST /api/lotes/:id/reprocessar*` e `/api/contracheques/reenviar-erros` - podem re-enfileirar
   um volume grande de jobs de uma vez.
