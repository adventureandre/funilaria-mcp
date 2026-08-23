# @expertcustom/funilaria-mcp

Servidor MCP (Model Context Protocol) com as tools tipadas que a IA do Aurora usa para escrever e ler no portal **Funilaria & Pintura**.

Ele substitui o `mcp-fetch` montando requisição HTTP à mão com o segredo escrito no system prompt: aqui cada operação é uma tool com schema, descrição e erro em português.

```
IA do Aurora ──stdio──> npx @expertcustom/funilaria-mcp ──HTTPS──> backend NestJS
```

Pela ADR-001, este pacote é **adaptador**: nenhuma regra de negócio mora aqui. Toda tool chama um endpoint que já existe, e o serviço do backend continua sendo o dono da decisão.

## Tools

| Tool | Endpoint | Autenticação | O que faz |
|---|---|---|---|
| `publicar_noticia` | `POST /noticias/ingestao` | serviço | Entrega uma matéria ao CMS **como rascunho**. Publicar continua sendo ato humano. |
| `responder_busca_peca` | `POST /buscas/webhook/resposta-fornecedor` | serviço | Registra a resposta crua do fornecedor no WhatsApp; o backend extrai preço, prazo e condição. |
| `lancar_consumo` | `POST /estoque/webhook/whatsapp` | serviço | Lança consumo de material a partir da mensagem do funcionário. Devolve em `respostaParaOFuncionario` o texto a mandar de volta. |
| `consultar_estoque` | `GET /estoque` | serviço + `shopId` | Saldo dos materiais da oficina, com destaque para o que está abaixo do mínimo. |
| `consultar_balancete` | `GET /estoque/balancete` | serviço + `shopId` | Consumo, entrada, perda e custo do período, por material e por funcionário. |
| `buscar_fornecedor` | `GET /fornecedores` | pública | Diretório de fornecedores com filtros de nome, tipo, categoria e localidade. |
| `consultar_pendencias_fornecedor` | `GET /fornecedores/pendencias` | serviço | O que o portal espera de um fornecedor, pelo WhatsApp dele: consultas de peça e pedidos em aberto. |

## Autenticação

**Credencial de serviço com `shopId` explícito** é o caminho principal, tanto para escrever quanto para ler. Header `x-aurora-secret`, o mesmo valor de `AURORA_WEBHOOK_SECRET` no backend; ele não representa pessoa nenhuma, representa o serviço.

Uma IA que atende várias oficinas não tem sessão, então a oficina é **parâmetro**, nunca contexto implícito. Do lado do backend isso é o `@AllowService()` nas rotas de leitura de estoque: o `JwtAuthGuard` aceita o segredo no lugar do JWT e o `ShopContextGuard` passa a exigir o `shopId` — id inexistente responde `404 Oficina não encontrada`, e não uma lista vazia que se confundiria com "oficina sem estoque".

**Sessão de usuário** (JWT de `POST /auth/entrar`) continua suportada para desenvolvimento local: sem `shopId`, a oficina vem da sessão. O access token dura ~15 min, então o cliente renova sozinho pelo refresh token e regrava o par rotacionado. Passar `shopId` nesse modo é recusado na hora, com explicação — a rota devolveria a oficina da sessão como se fosse a pedida.

### Configuração — env é o caminho principal

Em produção quem sobe este processo é o runtime do Aurora, que injeta as variáveis: **não há terminal, e nenhum comando de login é executado**. O servidor funciona com o disco totalmente vazio.

| Env | Apelido aceito | Para quê |
|---|---|---|
| `FUNILARIA_API_URL` | `PUBLIC_API_URL` | Base da API |
| `FUNILARIA_SERVICE_SECRET` | `AURORA_WEBHOOK_SECRET` | Segredo de serviço (`x-aurora-secret`) |
| `FUNILARIA_SIGNING_SECRET` | `AURORA_WEBHOOK_SIGNING_SECRET` | Segredo da assinatura HMAC (opcional) |
| `FUNILARIA_SHOP_ID` | — | Oficina padrão de `consultar_estoque` |
| `FUNILARIA_TOKEN` | — | JWT de usuário, se houver (opcional) |

Os apelidos existem para o erro clássico de copiar o `.env` do backend e o segredo "sumir" por causa do prefixo diferente — `AURORA_WEBHOOK_SECRET` é exatamente o mesmo valor dos dois lados.

Segredo nunca é hardcoded nem lido de prompt. O arquivo `~/.config/funilaria-mcp/credentials.json` (modo `0600`) é conveniência de **desenvolvimento local**; a env sempre vence e nunca é gravada em disco.

No boot, o servidor escreve em **stderr** (stdout é do protocolo MCP) uma linha dizendo o que está configurado e **de qual env veio cada coisa** — nunca o valor. É o que aparece no log do Aurora quando alguém erra o nome da variável:

```
[funilaria-mcp] API: https://api.exemplo.com (FUNILARIA_API_URL) · Credencial de serviço: configurada via AURORA_WEBHOOK_SECRET · ...
[funilaria-mcp] Sem credencial de serviço: as tools de escrita vão recusar toda chamada. Defina FUNILARIA_SERVICE_SECRET no ambiente deste processo.
```

### Assinatura HMAC

Quando `FUNILARIA_SIGNING_SECRET` existe, toda escrita leva também:

```
x-timestamp: <epoch em segundos>
x-signature: sha256=<HMAC-SHA256(`${timestamp}.${corpo}`)>
```

É a melhoria mapeada na ADR-001 (fecha replay e vazamento por log). O backend **ainda não verifica** — header desconhecido é ignorado, então dá para ligar o lado do servidor sem quebrar quem já está rodando.

## Instalação

### Na IA do Aurora (produção)

Registre o servidor com as variáveis no próprio cadastro do MCP — nada de login, nada de segredo no system prompt:

```json
{
  "command": "npx",
  "args": ["-y", "@expertcustom/funilaria-mcp"],
  "env": {
    "FUNILARIA_API_URL": "https://<api-do-portal>",
    "FUNILARIA_SERVICE_SECRET": "<mesmo valor de AURORA_WEBHOOK_SECRET>"
  }
}
```

### Local, para desenvolver

```bash
# opção A — env no shell (igual à produção)
FUNILARIA_API_URL=http://localhost:3334 FUNILARIA_SERVICE_SECRET=... npx @expertcustom/funilaria-mcp

# opção B — guardar em ~/.config para não exportar em todo shell
npx @expertcustom/funilaria-mcp login-servico

# sessão de usuário: só é necessária para consultar_estoque sem shopId
npx @expertcustom/funilaria-mcp login

# conferir o que está valendo e de onde veio (nunca imprime segredo)
npx @expertcustom/funilaria-mcp status

# registrar no Claude Code
claude mcp add funilaria --env FUNILARIA_API_URL=http://localhost:3334 -- npx -y @expertcustom/funilaria-mcp
```

## Pendências no backend

As quatro pendências originais (webhook de estoque inalcançável, leitura sem credencial de serviço, segredo checado depois da validação, distância como código morto) foram **corrigidas no backend** e revalidadas contra `localhost:3334`. O que sobrou:

1. **A IA não tem como descobrir o `shopId`.** É o único dado que ela precisa saber de cor, e hoje só chega por `FUNILARIA_SHOP_ID` — o que amarra um servidor a uma oficina e derruba o caso multi-oficina que motivou o desenho de serviço.

   O ponto mais barato de resolver é o `lancar_consumo`: o backend **já identificou** funcionário e oficina pelo número do WhatsApp, mas devolve só o texto de confirmação. Se `IntakeResult` incluísse `shopId` e `memberId`, a conversa fluiria — "usei 100ml de verniz" → "quanto gastei esse mês?" seria `consultar_balancete` com os dois ids em mãos. Sem isso, a segunda pergunta não tem resposta possível.

2. **`GET /estoque/movimentos` ficou fora do `@AllowService()`.** O `shopId` está declarado no `ListMovementsDto`, mas a rota não aceita credencial de serviço — o parâmetro não tem como ser usado. Ou marca a rota, ou tira o campo do DTO para não sugerir capacidade que não existe.

3. **Assinatura HMAC ainda não é verificada.** O cliente já envia `x-timestamp` e `x-signature` quando há segredo de assinatura (ver acima). Falta o lado do servidor para fechar replay e vazamento por log, como prevê a ADR-001.

## Desenvolvimento

```bash
npm install
npm run build     # tsc estrito, gera dist/
npm start         # sobe o servidor MCP em stdio
```
