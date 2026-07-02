# Ordens de Serviço — Contracheque Bot

Cada bloco abaixo é independente e pode ser copiado e colado separadamente no Claude Code. Todos assumem a raiz do projeto `contracheque-bot/` como diretório de trabalho.

---

## OS-01 — Remover código morto/quebrado em envioService.js

**Contexto:** `src/services/envioService.js` importa `require('./n8nService')`, arquivo que não existe no projeto, e usa a função `normalizarNome(...)` sem importá-la. Se esse arquivo for chamado, vai lançar erro em tempo de execução. Ele não é referenciado por nenhum outro módulo hoje (confirmado via `grep -rn "envioService" src/`), então é seguro removê-lo.

**Tarefa:**
1. Confirme novamente, via busca no código (`grep -rn "require('.*envioService')" src/` ou equivalente), que nenhum arquivo importa `src/services/envioService.js`.
2. Se confirmado que não há uso, delete o arquivo `src/services/envioService.js`.
3. Caso, durante a varredura, encontre algum uso que eu não tenha identificado, NÃO delete — em vez disso, corrija o arquivo: remova o `require('./n8nService')` (ou implemente/aponte para o serviço correto que substituiu essa funcionalidade) e adicione o `require('../utils/normalizarNome')` que está faltando.
4. Rode uma busca final para garantir que não sobrou nenhuma referência quebrada (`grep -rn "n8nService" src/`).
5. Não altere nenhum outro arquivo.

**Critério de aceite:** o projeto sobe (`npm start` / `node src/index.js`) sem erros de módulo não encontrado, e não há mais nenhuma referência a `n8nService` ou a `envioService.js` órfã no código.

---

## OS-02 — Substituir sleep manual no worker por rate limiter nativo do BullMQ

**Contexto:** `src/workers/envioContrachequeWorker.js` usa `concurrency: 1` e, dentro do processamento de cada job, chama `await esperar(intervalo * 1000)` (um `setTimeout` manual) para espaçar os envios e não sobrecarregar a Evolution API/WhatsApp. Isso trava o worker por `intervalo_envio` segundos a cada job processado, com dois problemas:
- (a) Se o processo do worker cair ou reiniciar durante esse sleep, o job pode ficar "stalled" no BullMQ (preso em estado ativo sem finalizar), exigindo configuração de `lockDuration`/`stalledInterval` mais cuidadosa ou intervenção manual.
- (b) Para lotes grandes (ex. 500 funcionários × 30s de intervalo) o processamento do lote inteiro leva ~4h, mesmo que o gargalo real seja só a taxa de envio ao WhatsApp, não o processamento em si.

**Tarefa:**
1. Abra `src/workers/envioContrachequeWorker.js` e `src/queues/envioQueue.js` (e o `src/queues/envioContrachequeQueue.js`, que hoje é um wrapper: `module.exports = require('./envioQueue')`).
2. Remova a função `esperar(ms)` e a chamada `await esperar(intervalo * 1000)` de dentro do handler do job (tanto no fluxo de sucesso quanto no fluxo de "BLOQUEADO").
3. Configure o `Worker` do BullMQ para usar a opção nativa `limiter`, por exemplo:
   ```js
   const worker = new Worker(
       'envio-contracheque',
       async (job) => { /* ...sem sleep... */ },
       {
           connection,
           concurrency: 1,
           limiter: {
               max: 1,
               duration: intervaloMs // ver ponto 4
           }
       }
   );
   ```
4. Como `intervalo_envio` é configurável dinamicamente via `configuracaoService` (tabela `Configuracao` no banco, editável pela tela de Configurações do frontend) e a opção `limiter` do BullMQ é definida na criação do `Worker` (não pode ser alterada job a job), implemente uma das duas abordagens — escolha a mais simples de manter:
   - **Opção A (recomendada para simplicidade imediata):** ao iniciar o worker, buscar o `intervalo_envio` atual do banco (`configuracaoService.obterConfiguracao()`) uma única vez, e usar esse valor para configurar `limiter.duration` na criação do `Worker`. Documentar no código que uma mudança no intervalo via tela de Configurações só terá efeito após reiniciar o worker (`docker restart contracheque-worker` ou equivalente).
   - **Opção B (mais robusta, se houver tempo):** implementar um mecanismo de recarregar/recriar o `Worker` do BullMQ quando o valor de `intervalo_envio` mudar (ex. escutando um evento ou fazendo polling periódico na config), fechando o worker atual (`worker.close()`) e criando um novo com o novo `limiter`.
   - Caso tenha dúvida sobre qual opção seguir, implemente a Opção A e deixe um comentário `// TODO: opção B` explicando o trade-off.
5. Garanta que os fluxos de log existentes (`logger.info` de início/fim de job, eventos `completed`/`failed`/`error`) continuem funcionando normalmente após a mudança.
6. Teste localmente processando um pequeno lote (pode usar os scripts em `src/scripts/testeEnvio.js` ou `src/scripts/testeEnvioSemSync.js`) e confirme, pelos logs com timestamp, que o espaçamento entre envios está sendo respeitado corretamente pelo rate limiter, e que os jobs não ficam mais "presos" caso o worker seja reiniciado no meio do processamento.

**Critério de aceite:** os envios continuam respeitando o intervalo configurado, mas o worker não fica mais bloqueado dentro do `sleep` durante o processamento do job; reiniciar o worker no meio de um lote não deixa jobs travados em estado "stalled".

---

## OS-03 — Completar o env-example

**Contexto:** o arquivo `env-example` na raiz do projeto não lista todas as variáveis de ambiente que o código efetivamente usa, dificultando o setup de um ambiente novo do zero. Hoje ele tem: `DATABASE_URL`, `WK_EMPRESA`, `WK_USUARIO`, `WK_SENHA`, `REDIS_HOST`, `REDIS_PORT`, `MODO_SIMULACAO`, `DIA_ENVIO_CONTRACHEQUES`, `PORT`. Faltam pelo menos `EVOLUTION_API_URL`, `EVOLUTION_INSTANCE` e `EVOLUTION_API_KEY`, que são lidas em `src/services/configuracaoService.js` como fallback inicial de configuração.

**Tarefa:**
1. Faça uma varredura completa no código-fonte por todos os usos de `process.env.` (`grep -rn "process.env\." src/` incluindo `src/config/`, `src/cron/`, `src/services/`, `src/lib/`) para montar a lista definitiva de variáveis usadas em produção (não incluir variáveis usadas só em `src/testes/` ou `src/scripts/`, a menos que sejam as mesmas do app principal).
2. Atualize o `env-example` incluindo todas as variáveis faltantes, com um comentário curto acima de cada uma explicando para que serve e, quando fizer sentido, um valor de exemplo (nunca um valor real/sensível — usar placeholders como `EVOLUTION_API_KEY=sua_chave_aqui`).
3. Adicione especificamente:
   - `EVOLUTION_API_URL=http://localhost:8080`
   - `EVOLUTION_INSTANCE=bot-contracheque`
   - `EVOLUTION_API_KEY=` (deixar vazio, com comentário indicando que deve ser preenchido e que é sensível — não commitar valor real)
   - Preencha um valor de exemplo sensato para `PORT` (ex. `PORT=3000`, hoje está vazio no arquivo atual).
4. Organize o arquivo em seções com comentários (`# Banco de dados`, `# ERP WK Radar`, `# Redis`, `# Evolution API (WhatsApp)`, `# Agendamento`), para facilitar leitura.
5. Não altere o `.env` real (que não existe no repositório, só o `.env-example`) nem nenhum outro arquivo de configuração.

**Critério de aceite:** alguém conseguindo rodar `cp env-example .env` e preenchendo os valores do `env-example` atualizado tem tudo que o sistema precisa para subir, sem precisar caçar variáveis direto no código-fonte.

---

## OS-04 — Webhook de confirmação de entrega/leitura (Evolution API)

**Contexto:** hoje o sistema marca um envio como `ENVIADO` (tabela `Envio`, campo `status`) no momento em que a chamada HTTP para a Evolution API retorna sucesso (`src/workers/envioContrachequeWorker.js`, dentro do try do processamento do job). Não há nenhuma confirmação de que o WhatsApp efetivamente entregou ou que o funcionário leu a mensagem. A Evolution API suporta webhooks que notificam eventos de status de mensagem (ex. `MESSAGES_UPDATE`, com status `SENT`, `DELIVERED`, `READ`).

**Tarefa:**
1. Pesquise na documentação da Evolution API (ou, se já configurada localmente, no painel/configuração da instância) quais eventos de webhook estão disponíveis para status de mensagem e qual é o payload exato desses eventos.
2. Adicione ao schema do Prisma (`prisma/schema.prisma`), no model `Envio`, novos campos para registrar o status de entrega, por exemplo:
   ```prisma
   statusEntregaWhatsapp String?   // ex: SENT, DELIVERED, READ
   dataEntregaWhatsapp   DateTime?
   dataLeituraWhatsapp   DateTime?
   whatsappMessageId     String?   // ID retornado pela Evolution API no envio, necessário para correlacionar com o webhook
   ```
   Gere a migration correspondente (`npx prisma migrate dev --name add_confirmacao_entrega_whatsapp`).
3. Em `src/services/evolutionSenderService.js`, capture o ID da mensagem retornado pela Evolution API na resposta do `POST /message/sendMedia/:instance` (verificar o campo exato no `response.data`, provavelmente algo como `key.id`), e persista esse ID no registro `Envio` correspondente (em `src/workers/envioContrachequeWorker.js`, no bloco onde hoje é feito `envioRepository.criar(...)` / `envioRepository.atualizar(...)` com `status: 'ENVIADO'`).
4. Crie uma nova rota no backend, por exemplo `POST /api/webhooks/evolution`, em um novo controller `src/controllers/webhookController.js`, registrada em `src/routes/apiRoutes.js`. Essa rota deve:
   - Receber o payload do webhook da Evolution API.
   - Validar que o evento é do tipo relevante (status de mensagem).
   - Extrair o `messageId` (correlacionando com `whatsappMessageId` salvo no passo 3) e o novo status (`DELIVERED`/`READ`/etc).
   - Atualizar o registro `Envio` correspondente com o novo status e timestamp (`dataEntregaWhatsapp` ou `dataLeituraWhatsapp`, conforme o evento).
   - Responder `200 OK` rapidamente (processamento deve ser leve, sem lógica pesada síncrona).
5. Documente no `README.md`, na seção de configuração da Evolution API, como configurar a URL do webhook (`http://<host-do-backend>:<porta>/api/webhooks/evolution`) na instância da Evolution API.
6. Adicione tratamento de erro: se o webhook chegar com um `messageId` que não existe em nenhum `Envio`, logar um aviso (`logger.warn`) e retornar `200 OK` mesmo assim (para a Evolution API não ficar reenviando o webhook).
7. Exponha esse novo status no frontend, na tela de Relatórios ou Lotes (ver também OS-06), como uma coluna ou badge adicional (ex. "Entregue", "Lido") quando o dado estiver disponível.

**Critério de aceite:** ao enviar um contracheque de teste e simular/receber um evento real de entrega/leitura via webhook, o registro correspondente na tabela `Envio` é atualizado com o novo status e timestamp, visível no frontend.

**Observação de segurança:** como esta rota é um endpoint público chamado pela Evolution API (não pelo usuário do painel), avaliar se a Evolution API suporta autenticação por token/secret no webhook e, se sim, implementar validação desse token na rota para evitar que qualquer requisição externa forje eventos de entrega falsos.

---

## OS-05 — Painel de saúde da integração com o WK Radar

**Contexto:** hoje, informações importantes sobre a sincronização com o ERP WK Radar (data/hora da última sincronização, quantidade de funcionários sincronizados, quantidade de funcionários ignorados por não terem CPF) só existem nos logs (`src/services/wkService.js`, função `sincronizarFuncionarios`, que já calcula `total` e `ignorados` e loga via `logger.info`). Nada disso está exposto no dashboard do frontend.

**Tarefa:**

**Backend:**
1. Adicione uma tabela no Prisma para persistir o histórico de sincronizações, por exemplo um novo model em `prisma/schema.prisma`:
   ```prisma
   model SincronizacaoWK {
     id                Int      @id @default(autoincrement())
     dataInicio        DateTime
     dataFim           DateTime?
     sucesso           Boolean  @default(false)
     totalRecebidos     Int?
     totalSincronizados Int?
     totalIgnorados     Int?
     mensagemErro      String?
     createdAt         DateTime @default(now())
   }
   ```
   Gere a migration (`npx prisma migrate dev --name add_sincronizacao_wk_historico`).
2. Em `src/services/wkService.js`, na função `sincronizarFuncionarios()`, registre um novo registro em `SincronizacaoWK` no início da execução (com `dataInicio`) e atualize-o ao final (com `dataFim`, `sucesso`, `totalRecebidos`, `totalSincronizados`, `totalIgnorados`, e em caso de erro, `mensagemErro`). Use um repository novo (`src/repositories/sincronizacaoWKRepository.js`) seguindo o padrão dos repositories já existentes no projeto (ex. `src/repositories/funcionarioRepository.js`).
3. Crie um novo endpoint, por exemplo `GET /api/wk/status`, em um controller (`src/controllers/wkStatusController.js`), registrado em `src/routes/apiRoutes.js`, retornando:
   - Dados da última sincronização (data/hora, sucesso/falha, totais).
   - Histórico das últimas N sincronizações (para exibir um mini-histórico/gráfico simples).
   - Contagem atual de funcionários ativos vs inativos na tabela `Funcionario` (usar `funcionarioRepository` existente ou adicionar método novo, ex. `contarPorStatus()`).

**Frontend:**
4. Adicione uma nova seção "Saúde da Integração WK Radar" na tela `frontend/src/pages/Monitoramento.jsx` (ou crie um card dedicado, se preferir manter Monitoramento focado em métricas de sistema/BullMQ), consumindo o novo endpoint `/api/wk/status`, exibindo:
   - Data/hora da última sincronização e status (sucesso/falha).
   - Quantidade de funcionários sincronizados vs ignorados na última execução.
   - Total de funcionários ativos cadastrados atualmente.
   - Se a última sincronização falhou, destacar visualmente (ex. badge vermelho) e mostrar a mensagem de erro.
5. Siga o padrão visual já usado nas outras páginas (`stat-card`, `card`, `card-header`, classes já existentes no `App.css`/`Dashboard.css`) para manter consistência.

**Critério de aceite:** ao rodar uma sincronização manual ou automática (cron das 03:00), o histórico fica visível no frontend sem precisar olhar os logs do container.

---

## OS-06 — Exportação de relatórios em CSV/Excel

**Contexto:** a tela `frontend/src/pages/Relatorios.jsx` (e seu endpoint correspondente, `GET /api/relatorios`, em `src/controllers/relatoriosController.js`) hoje exibe dados apenas na tela, sem opção de exportação para uso pelo RH.

**Tarefa:**

**Backend:**
1. Analise `src/controllers/relatoriosController.js` e o(s) service(s) que ele usa para entender exatamente quais dados/filtros já são suportados hoje (ex. por competência, por status).
2. Adicione um novo endpoint, por exemplo `GET /api/relatorios/exportar`, que aceite os mesmos parâmetros de filtro já usados por `GET /api/relatorios` (query params), mais um parâmetro `formato` (`csv` ou `xlsx`).
3. Para CSV: gerar a string CSV diretamente em Node (pode usar uma lib leve como `json2csv` ou implementar manualmente, dado que os dados já vêm de uma query no Postgres via Prisma) e responder com headers apropriados (`Content-Type: text/csv`, `Content-Disposition: attachment; filename="relatorio-<data>.csv"`).
4. Para XLSX: usar uma biblioteca como `exceljs` (adicionar ao `package.json` do backend) para gerar um arquivo `.xlsx` em memória e enviá-lo com `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
5. Garanta que os campos exportados incluam pelo menos: nome do funcionário, CPF (avaliar se deve ser mascarado no export, ex. mostrar só os 3 últimos dígitos, dado que já é dado usado como senha do PDF — sugerir isso ao usuário e implementar mascarado por padrão, com uma flag/checkbox explícita "incluir CPF completo" caso o RH realmente precise para conciliação), telefone, competência, status do envio, data de envio, mensagem de erro (quando houver).

**Frontend:**
6. Em `frontend/src/pages/Relatorios.jsx`, adicione dois botões ("Exportar CSV" e "Exportar Excel") que chamam o novo endpoint passando os filtros atualmente aplicados na tela, e disparam o download do arquivo retornado (usar `axios` com `responseType: 'blob'` e criar um link temporário via `URL.createObjectURL` para forçar o download no navegador).
7. Mostrar um estado de carregamento (spinner/disabled) nos botões durante a geração do arquivo, já que para volumes grandes a geração pode levar alguns segundos.

**Critério de aceite:** ao clicar em "Exportar CSV" ou "Exportar Excel" na tela de Relatórios, o navegador baixa um arquivo com os dados atualmente filtrados na tela, abrindo corretamente no Excel/Google Sheets.

---

## OS-07 — Data e hora de envio configuráveis no upload do lote (hoje hardcoded)

**Contexto:** hoje, o disparo do processamento/envio do lote de contracheques é decidido inteiramente por `src/cron/agendador.js`, que roda todo dia à meia-noite (`cron.schedule('0 0 * * *', ...)`) e verifica se o dia atual bate com `process.env.DIA_ENVIO_CONTRACHEQUES` (padrão: dia 5 do mês). Não existe hoje nenhuma forma de, no momento do upload do lote de PDFs (`frontend/src/pages/Upload.jsx` → `POST /api/uploads`), informar uma data/hora específica de disparo para aquele lote — o dia é sempre o mesmo, fixo por variável de ambiente, todo mês.

**Tarefa:**

**Banco de dados:**
1. Adicione um novo model no Prisma para representar um "agendamento de lote", por exemplo:
   ```prisma
   model AgendamentoLote {
     id             Int       @id @default(autoincrement())
     dataHoraEnvio  DateTime
     status         String    @default("PENDENTE") // PENDENTE, EXECUTADO, CANCELADO
     arquivos       String[]  // nomes dos arquivos associados a este agendamento, ou relacionar com Envio se fizer mais sentido
     criadoPor      String?
     createdAt      DateTime  @default(now())
     executadoEm    DateTime?
   }
   ```
   Avalie, junto com o schema existente (`model Envio`), a melhor forma de relacionar os arquivos enviados a um agendamento específico — pode ser um campo `agendamentoLoteId` na tabela `Envio`, ou manter simples como uma lista de nomes de arquivo no próprio `AgendamentoLote`, dependendo de quanto rastreamento for necessário. Gere a migration correspondente.

**Backend:**
2. Altere o endpoint `POST /api/uploads` (`src/controllers/uploadsController.js`) para aceitar, além dos arquivos, dois novos campos no corpo da requisição (via `multipart/form-data`, campos de texto adicionais junto com os arquivos): `dataHoraEnvio` (ISO 8601). Se não for informado, manter o comportamento atual (cair no agendamento padrão do cron/`DIA_ENVIO_CONTRACHEQUES`) para não quebrar fluxos existentes.
3. Quando `dataHoraEnvio` for informado, criar um registro em `AgendamentoLote` com esses dados, status `PENDENTE`.
4. Crie um novo job de cron (ou amplie `src/cron/agendador.js`) que rode com granularidade menor (ex. a cada minuto: `cron.schedule('* * * * *', ...)`) e verifique se existe algum `AgendamentoLote` com `status: 'PENDENTE'` cujo `dataHoraEnvio` já passou. Se sim, disparar `processadorLote.processarPasta()` (ou uma variação que processe apenas os arquivos associados àquele agendamento específico, se a relação arquivo↔agendamento tiver sido implementada) e marcar o agendamento como `EXECUTADO` com `executadoEm` preenchido.
5. Trate concorrência: usar uma trava simples via Redis (seguindo o padrão já usado em `src/cron/agendador.js` com `redis.set(chave, 'true', 'EX', ...)`) para evitar que o mesmo agendamento seja disparado duas vezes caso o cron rode em paralelo com outro gatilho.
6. Exponha um endpoint `GET /api/agendamentos` para listar agendamentos pendentes/executados, e `DELETE /api/agendamentos/:id` (ou `POST /api/agendamentos/:id/cancelar`) para permitir cancelar um agendamento antes da execução.

**Frontend:**
7. Em `frontend/src/pages/Upload.jsx`, adicione um campo de data/hora (ex. `<input type="datetime-local">`) antes do botão "Enviar arquivos", com um texto explicativo do tipo "Quando este lote deve ser enviado? (deixe em branco para usar o agendamento padrão do sistema)". Envie esse valor junto com os arquivos no `FormData` do `POST /api/uploads`.
8. Adicione uma nova tela ou seção (pode ser dentro da tela de Lotes, `frontend/src/pages/Lotes.jsx`) listando os agendamentos pendentes, com opção de cancelar.

**Critério de aceite:** ao fazer upload de um lote informando uma data/hora específica, o sistema dispara o processamento automaticamente nesse horário (sem precisar esperar o dia fixo do cron), e é possível visualizar/cancelar agendamentos pendentes pelo frontend.

---

## OS-08 — Mensagem de envio customizável com nome do colaborador via tag dinâmica

**Contexto:** hoje a mensagem enviada junto com o PDF é fixa e hardcoded em `src/services/evolutionSenderService.js`, dentro da função `enviarPdfDireto`, no campo `caption` do payload:
```js
caption: `Olá, ${nomeFuncionario || 'Colaborador'}. Segue seu contracheque referente a ${competencia || 'competência atual'}.`
```
O objetivo é permitir customizar o texto completo da mensagem (não só o nome), usando uma tag dinâmica para o nome do funcionário (e possivelmente outras variáveis, como competência), sem precisar alterar código a cada mudança de texto. Exemplo de mensagem desejada pelo usuário:
```
Olá *{nome}*
Segue em anexo o seu contracheque.
🔒 Para acessar o PDF, utilize como senha os 3 últimos dígitos do seu CPF.
Em caso de dúvidas, entre em contato com o setor de Gente.
```

**Tarefa:**

**Banco de dados:**
1. Adicione um campo de template de mensagem à tabela `Configuracao` já existente em `prisma/schema.prisma` (mesma tabela usada para `evolution_url`, `evolution_instance`, etc.), por exemplo:
   ```prisma
   mensagem_template String @default("Olá *{nome}*\nSegue em anexo o seu contracheque.\n🔒 Para acessar o PDF, utilize como senha os 3 últimos dígitos do seu CPF.\nEm caso de dúvidas, entre em contato com o setor de Gente.")
   ```
   Gere a migration (`npx prisma migrate dev --name add_mensagem_template_configuracao`).

**Backend:**
2. Em `src/services/configuracaoService.js` e `src/repositories/configuracaoRepository.js`, garanta que `mensagem_template` seja lido/gravado junto com os demais campos de configuração (mesmo padrão de `evolution_url`, `intervalo_envio`, etc., já existente nesses arquivos).
3. Crie uma função utilitária nova, por exemplo `src/utils/renderizarMensagem.js`, que receba o template (string) e um objeto de dados (ex. `{ nome, competencia }`) e substitua as tags no formato `{nome}`, `{competencia}` pelos valores correspondentes. Usar substituição simples via regex (ex. `template.replace(/\{nome\}/g, dados.nome)`), sem necessidade de engine de template pesado. Tratar o caso de a tag existir no template mas o dado não estar disponível (usar fallback, ex. `'Colaborador'` para nome).
4. Em `src/services/evolutionSenderService.js`, na função `enviarPdfDireto`, substitua a linha fixa do `caption` por uma chamada à nova função, buscando o template salvo via `configuracaoService.obterConfiguracao()` (que já é chamado logo abaixo nesse mesmo arquivo para pegar URL/instância/API key — reaproveitar a mesma chamada, não duplicar):
   ```js
   const renderizarMensagem = require('../utils/renderizarMensagem');
   // ...
   const config = await configuracaoService.obterConfiguracao();
   const caption = renderizarMensagem(config.mensagem_template, { nome: nomeFuncionario, competencia });
   ```
5. Garanta que o valor de `nomeFuncionario` passado para essa função já está disponível no fluxo atual do worker (`src/workers/envioContrachequeWorker.js`, variável `nomeFuncionario` extraída de `job.data`) — não deve ser necessário buscar dados adicionais.

**Frontend:**
6. Em `frontend/src/pages/Configuracoes.jsx`, adicione um novo campo de formulário (`<textarea>`, multi-linha) para editar o `mensagem_template`, dentro do card "Configurações de Envio" já existente (ou um novo card "Mensagem do WhatsApp"), com:
   - Texto de ajuda explicando as tags disponíveis (ex. "Use {nome} para o nome do funcionário e {competencia} para o mês/ano de referência").
   - Uma prévia (preview) ao vivo abaixo do campo, substituindo `{nome}` por um nome de exemplo (ex. "João da Silva") e `{competencia}` por um valor de exemplo (ex. "06/2026"), atualizada conforme o usuário digita, para facilitar visualizar como a mensagem vai ficar no WhatsApp (incluindo quebras de linha e formatação `*negrito*` do WhatsApp, se quiser renderizar visualmente).
7. Incluir `mensagem_template` no objeto salvo pelo `handleSave` (função já existente que faz `axios.put('/api/configuracoes', config)`), já que o backend passará a aceitar/persistir esse campo.

**Critério de aceite:** ao alterar o template de mensagem na tela de Configurações e salvar, o próximo contracheque enviado usa o novo texto, com `{nome}` substituído corretamente pelo nome de cada funcionário no momento do envio (validar com pelo menos 2 funcionários diferentes no mesmo lote, confirmando que cada um recebe seu próprio nome, não um nome fixo/do último processado).

---

### Observação geral para todas as OS acima

Nenhuma dessas ordens de serviço deve alterar o comportamento de autenticação/autorização do sistema — isso está fora de escopo por enquanto, pois será tratado separadamente quando o sistema de login for implementado. Ao criar novos endpoints (webhooks, exportação, agendamentos), seguir o mesmo padrão hoje usado nas rotas existentes em `src/routes/apiRoutes.js` (sem middleware de auth), mas deixando comentado no código (`// TODO: proteger esta rota quando o sistema de login for implementado`) para facilitar a inclusão futura do middleware de autenticação.
