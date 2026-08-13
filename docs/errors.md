# Códigos de Erro

## Formato - inconsistente entre controllers (documentado como está, não como deveria ser)

Não existe um formato de erro único ou um error handler global neste backend - cada controller
faz seu próprio `try/catch` e monta a resposta à mão. Três variações convivem hoje:

**Mais comum** - `{ error: string }`:
```json
{ "error": "Falha ao obter métricas" }
```

**`reenvioController`** - inclui `success: false`:
```json
{ "success": false, "error": "Contracheque já foi enviado" }
```

**`configuracoesController`** - campos em português, `erro` (não `error`):
```json
{ "sucesso": false, "erro": "mensagem" }
```

Se for consumir a API programaticamente, trate `error` OU `erro` dependendo do endpoint - não dá
pra assumir um único campo.

## Sem error handler global

Uma exceção não capturada por um `try/catch` de controller **não** vira um JSON de erro - vira a
página de erro HTML padrão do Express. Isso é diferente do IdP (que tem um handler global
convertendo `DomainError` em JSON consistente).

## Status codes em uso

| Código | Quando |
|---|---|
| 200 | Sucesso |
| 201 | Upload concluído |
| 202 | `/api/processar-lote` aceito (processamento assíncrono) |
| 302 | `requireAuth` sem sessão válida - redireciona pro `/auth/login` (não é JSON) |
| 400 | Parâmetro inválido (`id` não numérico, `dataHoraEnvio` mal formatada, `bloqueia_contracheque` não booleano) ou erro de regra de negócio (`reenviarContracheque`) |
| 401 | Webhook da Evolution API com token inválido (`EVOLUTION_WEBHOOK_TOKEN` configurado e não batendo) |
| 403 | `requireRole('admin')` sem o papel `admin` (só em `/admin/queues`) |
| 404 | Recurso não encontrado (agendamento, lote) |
| 500 | Erro não previsto, capturado no `try/catch` do controller |

## Exemplos

### 400 - Parâmetro inválido

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/lotes/ID_INVALIDO/cancelar

HTTP/1.1 400 Bad Request
{ "error": "Identificador de lote inválido." }
```

### 401 - Webhook com token errado

```bash
curl -X POST "http://localhost:3001/api/webhooks/evolution?token=errado" \
  -H "Content-Type: application/json" -d '{}'

HTTP/1.1 401 Unauthorized
{ "error": "Token inválido" }
```

### 302 - Sem sessão

```bash
curl -i http://localhost:3001/api/me

HTTP/1.1 302 Found
Location: /auth/login?returnTo=%2Fapi%2Fme
```
