# Autenticação

Este backend **não implementa login próprio** - toda autenticação é delegada ao IdP centralizado
(`Centralizador-de-login`), via `@copperline/idp-client`.

## Fluxo completo

1. **Frontend redireciona pro backend:**
   ```
   GET http://localhost:3001/auth/login
   ```
   O `idp-client` gera um `state` anti-CSRF, guarda na sessão local, e redireciona pro `/authorize` do IdP.

2. **Usuário loga no IdP** (se ainda não tiver sessão lá) e é redirecionado de volta:
   ```
   GET http://localhost:3001/auth/callback?code=...&state=...
   ```

3. **`/auth/callback`** valida o `state`, troca o `code` por tokens (`POST /token` no IdP) e guarda
   tudo na **sessão local deste backend** - nunca no navegador. A sessão é persistida no Redis
   (cliente `redis`, não o `ioredis` usado pelo BullMQ - ver comentário em `src/app.js`).

4. **Redireciona pro frontend** (`FRONTEND_URL`, ex.: `http://localhost:5173`).

5. **Toda chamada subsequente à API** (`/api/*`) usa o **cookie de sessão** (`connect.sid`), não um
   header `Authorization: Bearer`:
   ```bash
   curl -b cookies.txt http://localhost:3001/api/dashboard/indicadores
   ```

## Importante: `requireAuth` não retorna 401 JSON

Diferente de uma API REST convencional, o middleware `requireAuth` do `idp-client` **redireciona**
(`302` pro `/auth/login`) quando não há sessão válida - não responde `401 { error }`. Isso é
transparente pra navegação normal do navegador, mas pode surpreender quem consome a API via
`fetch`/`curl` esperando um JSON de erro: sem `credentials: 'include'` (fetch) ou cookie válido,
a resposta que volta é o `redirect` (ou o HTML da página de login, se o cliente seguir o redirect
automaticamente).

## Papéis (roles)

Papéis cadastrados no IdP para este sistema: **`usuario`** e **`admin`**. `admin` é exigido
especificamente pra acessar `/admin/queues` (painel Bull Board de filas) - `requireRole('admin')`,
aplicado depois de `requireAuth`.

## Logout

```
GET http://localhost:3001/auth/logout
```

Revoga o `refresh_token` no IdP (best-effort) e destrói a sessão local. **Não** encerra a sessão do
IdP em si (SSO) - pra isso, veja a documentação de RP-Initiated Logout do IdP
(`GET /session/end`), que o `idp-client` mais recente já chama automaticamente nesse fluxo.

## Sem chamadas diretas ao IdP a partir deste backend (exceto internamente pelo idp-client)

Este backend nunca expõe `client_secret`, `access_token` ou `refresh_token` pro frontend - tudo
fica encapsulado na sessão do lado do servidor.
