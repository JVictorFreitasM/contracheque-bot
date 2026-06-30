# Contracheque Bot

Sistema de automação de envio de contracheques para funcionários via WhatsApp. Sincroniza dados de funcionários diretamente do ERP **WK Radar**, lê os PDFs de contracheque enviados para uma pasta, valida cada documento contra o cadastro do funcionário e envia via **Evolution API**.

## Sumário

- [Visão geral do fluxo](#visão-geral-do-fluxo)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar do zero (passo a passo)](#como-rodar-do-zero-passo-a-passo)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Deploy em produção](#deploy-em-produção)
- [Troubleshooting](#troubleshooting)

---

## Visão geral do fluxo

```mermaid
flowchart TD
    A[WK Radar - ERP] -->|"GET /empregados (diário, 03:00)"| B[wkService.sincronizarFuncionarios]
    B --> C[(Postgres - tabela Funcionario)]

    D[Pasta uploads/ com PDFs] -->|"Todo dia 5 do mês"| E[processadorLoteService.processarPasta]
    E -->|"Extrai número e nome do PDF"| F{Funcionário existe no banco?}
    F -->|Não| G[Status: FUNCIONARIO_NAO_ENCONTRADO]
    F -->|Sim, nome diverge| H[Status: NOME_DIVERGENTE]
    F -->|Sim, OK| I[Gera job na fila BullMQ]

    I --> J[Worker - envioContrachequeWorker]
    J -->|"Chave: 3 últimos dígitos do CPF"| K[Evolution API]
    K -->|WhatsApp| L[Funcionário recebe o contracheque]

    J -->|Falha de envio| M[Status: ERRO_ENVIO]
    J -->|Telefone ausente| N[Status: SEM_TELEFONE]

    O[Frontend - Dashboard] -->|consulta| C
    O -->|consulta status do lote / SSE| J
```

**Resumo em texto:**

1. Todo dia, às 03:00, o sistema sincroniza os funcionários ativos com o WK Radar (`GET /empregados`) e atualiza a tabela `Funcionario` no Postgres (número, nome, CPF, telefone).
2. Todo dia 5 do mês, o sistema lê os PDFs presentes na pasta `uploads/`, extrai o número e o nome do funcionário de cada arquivo, e confere contra o cadastro no banco.
3. Para cada PDF válido, é criado um job em uma fila (BullMQ + Redis), processado pelo worker, que envia o contracheque por WhatsApp via Evolution API.
4. A chave de segurança do PDF enviado são os **3 últimos dígitos do CPF** do funcionário.
5. O frontend exibe um dashboard com indicadores (pendentes, enviados, erros, duplicados) e acompanha o progresso do lote em tempo real via SSE (`/api/processamento/stream`).

---

## Arquitetura

```mermaid
flowchart LR
    subgraph Docker [Rede Docker: automacoes]
        FE[frontend\nnginx :80] -->|proxy /api| BE[backend\nnode :3001]
        BE --> PG[(postgres :5432)]
        BE --> RD[(redis :6379)]
        WK[worker\nnode] --> PG
        WK --> RD
    end

    User[Navegador do usuário] -->|":5173"| FE
    BE -->|HTTPS| WKR[WK Radar API]
    WK -->|HTTPS| EVO[Evolution API]
```

| Serviço | Tecnologia | Responsabilidade |
|---|---|---|
| `frontend` | React + Vite, servido via nginx | Dashboard, upload de PDFs, acompanhamento de lotes |
| `backend` | Node.js + Express | API REST, SSE, agendador (cron), sincronização com WK Radar |
| `worker` | Node.js + BullMQ | Processa a fila de envio de contracheques via Evolution API |
| `postgres` | PostgreSQL | Armazena funcionários, lotes, envios e status |
| `redis` | Redis | Fila de jobs (BullMQ) e locks do agendador |

> ⚠️ **Atenção:** verifique se o `backend` não está iniciando o worker internamente (`require('./workers/envioContrachequeWorker')` em `src/index.js`) **e** o container `worker` rodando o mesmo arquivo ao mesmo tempo. Isso causaria processamento duplicado de jobs (e contracheques enviados duas vezes). Mantenha o worker rodando em **apenas um** dos dois lugares.

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/) instalados
- Acesso de rede ao WK Radar (API do ERP)
- Instância da Evolution API já configurada, com instância do WhatsApp conectada
- Node.js 20+ (apenas se for rodar fora do Docker, para desenvolvimento local)

---

## Como rodar do zero (passo a passo)

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd contracheque-bot
```

### 2. Criar o arquivo `.env`

Copie o exemplo e preencha com os valores reais:

```bash
cp env-example .env
```

Edite o `.env` com os valores do seu ambiente (veja a seção [Variáveis de ambiente](#variáveis-de-ambiente) abaixo).

### 3. Buildar as imagens Docker

Use o script `build.sh` (Linux/macOS/Git Bash/WSL):

```bash
chmod +x build.sh
./build.sh
```

Ou, no Windows (PowerShell/CMD), rode os comandos manualmente:

```powershell
docker build -t contracheque-bot-backend:latest -f backend/Dockerfile .
docker build -t contracheque-bot-worker:latest -f worker/Dockerfile .
docker build -t contracheque-bot-frontend:latest -f frontend/Dockerfile ./frontend
```

### 4. Subir os containers

```bash
docker compose up -d
```

### 5. Aplicar as migrations do banco

Na primeira vez (banco vazio), é necessário aplicar as migrations do Prisma manualmente, pois o build não faz isso automaticamente:

```bash
docker exec -it contracheque-backend npx prisma migrate deploy
```

### 6. Conferir se tudo subiu corretamente

```bash
docker compose ps
docker logs contracheque-backend --tail 50
docker logs contracheque-worker --tail 50
```

Todos os containers devem aparecer com status `Up` (não `Restarting`).

### 7. Acessar a aplicação

- Frontend: `http://<ip-do-servidor>:5173`
- API (uso interno/debug): `http://<ip-do-servidor>:3001/api`
- Bull Board (monitoramento de filas): `http://<ip-do-servidor>:3001/admin/queues`

### 8. Testar a sincronização manualmente (opcional)

Para não esperar até as 03:00 ou o dia 5, você pode disparar a sincronização chamando o endpoint correspondente ou executando o script via `docker exec` (verifique se existe um endpoint/rota manual de sincronização antes de usar em produção).

---

## Desenvolvimento local (sem Docker)

O passo a passo acima cobre rodar **tudo via Docker** — nesse caso, o `npm install` já acontece automaticamente dentro do `docker build` (`RUN npm ci` no `backend/Dockerfile`, `RUN npm install` no `frontend/Dockerfile`), então você **não precisa rodar `npm install` manualmente**.

Mas se for desenvolver localmente, com hot-reload (sem rebuildar a imagem a cada alteração), aí sim é necessário instalar as dependências na sua máquina:

### Backend / Worker

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # ou migrate dev, se for criar uma nova migration
node src/index.js
```

> Nesse modo, você ainda precisa de um Postgres e um Redis acessíveis (pode subir só esses dois via `docker compose up -d postgres redis` e apontar o `.env` local para `localhost`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite vai subir em `http://localhost:5173` com hot-reload, usando o `proxy` configurado em `frontend/vite.config.js` para redirecionar `/api` para o backend.

---

## Variáveis de ambiente

Arquivo `.env`, na raiz do projeto:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão do Postgres | `postgres://admin:admin@postgres:5432/contracheque` |
| `WK_EMPRESA` | Código/identificador da empresa no WK Radar | `123` |
| `WK_USUARIO` | Usuário de autenticação na API do WK Radar | `usuario.integracao` |
| `WK_SENHA` | Senha de autenticação na API do WK Radar | `********` |
| `REDIS_HOST` | Host do Redis (fallback, se `REDIS_URL` não for usada) | `redis` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `MODO_SIMULACAO` | Se `true`, não envia mensagens de fato (modo de teste) | `false` |
| `DIA_ENVIO_CONTRACHEQUES` | Dia do mês em que o processamento de PDFs é disparado | `5` |
| `PORT` | Porta em que o backend escuta | `3001` |

> 🔒 **Segurança:** não versione o `.env` real no Git. Mantenha-o fora da imagem Docker (via `.dockerignore`) e monte-o como volume no `docker-compose.yml`, ou injete via variáveis de ambiente do servidor/CI.

---

## Endpoints da API

Prefixo base: `/api`

### Dashboard e status

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/dashboard/indicadores` | Indicadores agregados (pendentes, enviados, erros, duplicados) |
| `GET` | `/status/servicos` | Status dos serviços (banco, redis, etc.) |
| `GET` | `/health` | Health check simples |
| `GET` | `/monitoramento` | Uso de memória, uptime e contagem de jobs |

### Upload e pré-validação de PDFs

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/uploads` | Upload de PDFs de contracheque |
| `POST` | `/uploads/pre-validar` | Valida os PDFs antes de processar (sem enviar) |

### Pendências e erros

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/pendentes` | Lista contracheques pendentes de envio |
| `GET` | `/erros` | Lista envios com erro |

### Lotes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/lotes` | Lista os lotes de processamento |
| `GET` | `/lotes/:id/progresso` | Progresso de um lote específico |
| `POST` | `/lotes/:id/cancelar` | Cancela um lote em andamento |
| `POST` | `/lotes/:id/reprocessar` | Reprocessa um lote inteiro |
| `POST` | `/lotes/:id/reprocessar-erros` | Reprocessa apenas os itens com erro de um lote |
| `POST` | `/lotes/:id/reprocessar-pendentes` | Reprocessa apenas os itens pendentes de um lote |
| `GET` | `/lotes/:id/reprocessamentos` | Histórico de reprocessamentos de um lote |

### Funcionários

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/funcionarios` | Lista funcionários cadastrados |
| `PATCH` | `/funcionarios/:id/bloqueio-contracheque` | Bloqueia/desbloqueia o envio de contracheque para um funcionário |

### Relatórios e reenvio

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/relatorios` | Relatórios de envio |
| `POST` | `/contracheques/:id/reenviar` | Reenvia um contracheque específico |
| `POST` | `/contracheques/reenviar-erros` | Reenvia todos os contracheques com erro |

### Processamento em tempo real

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/processamento/status` | Status atual do processamento do lote do mês |
| `GET` | `/processamento/stream` | Stream **SSE** com atualizações em tempo real do progresso |

### Configurações

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/configuracoes` | Obtém as configurações atuais do sistema |
| `PUT` | `/configuracoes` | Atualiza as configurações do sistema |

---

## Estrutura de pastas

```
contracheque-bot/
├── backend/
│   └── Dockerfile
├── worker/
│   └── Dockerfile
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── pages/
│       └── services/apiFetch.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.js                 # configuração do Express
│   ├── index.js                # entrypoint do backend
│   ├── controllers/
│   ├── routes/apiRoutes.js
│   ├── services/
│   │   ├── wkService.js              # integração com WK Radar
│   │   └── processadorLoteService.js # leitura de PDFs e disparo de envio
│   ├── workers/
│   │   └── envioContrachequeWorker.js # consumidor da fila (Evolution API)
│   ├── cron/
│   │   └── agendador.js        # agendamento diário e do dia 5
│   └── config/
│       └── redis.js
├── docker-compose.yml
├── build.sh
├── env-example
└── package.json
```

---

## Deploy em produção

Para gerar as imagens localmente e transportar para um servidor sem acesso ao registry/internet de build:

```bash
# 1. Buildar as imagens
./build.sh

# 2. Exportar para um único arquivo .tar
docker save -o contracheque-bot.tar \
  contracheque-bot-backend:latest \
  contracheque-bot-worker:latest \
  contracheque-bot-frontend:latest

# 3. Transferir para o servidor
scp contracheque-bot.tar usuario@ip-do-servidor:/caminho/destino/
scp docker-compose.yml usuario@ip-do-servidor:/caminho/destino/
scp .env usuario@ip-do-servidor:/caminho/destino/

# 4. No servidor: carregar as imagens e subir
docker load -i contracheque-bot.tar
docker compose up -d
docker exec -it contracheque-backend npx prisma migrate deploy
```

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| Container reiniciando em loop | Erro na inicialização do Express/dependências | `docker logs contracheque-backend --tail 100` |
| Dashboard com tela em branco | API indisponível / dados nulos não tratados no frontend | Conferir se `backend` está `Up`; checar console do navegador |
| `ERR_CONNECTION_REFUSED` no navegador | Backend não está rodando ou nginx não está fazendo proxy corretamente | Conferir `nginx.conf` (`proxy_pass http://backend:3001`) e `docker compose ps` |
| Tabelas não existem no banco | Migrations não aplicadas | `docker exec -it contracheque-backend npx prisma migrate deploy` |
| Contracheque enviado duas vezes | Worker duplicado (rodando dentro do backend **e** em container separado) | Manter o consumo da fila em apenas um processo |
| Erro de CORS no navegador | Origem do frontend não está na lista `allowedOrigins` do backend | Atualizar `src/app.js` com o domínio/IP real de produção |

---

## Licença

Uso interno — projeto proprietário.
