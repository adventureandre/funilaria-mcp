# @expertcustom/funilaria-mcp

Servidor MCP (Model Context Protocol) com as tools tipadas que a IA do Aurora usa para escrever e ler no portal **Funilaria & Pintura**.

Ele substitui o `mcp-fetch` montando requisição HTTP à mão com o segredo escrito no system prompt: aqui cada operação é uma tool com schema, descrição e erro em português.

```
IA do Aurora ──stdio──> npx @expertcustom/funilaria-mcp ──HTTPS──> backend NestJS
```

Pela ADR-001, este pacote é **adaptador**: nenhuma regra de negócio mora aqui. Toda tool chama um endpoint que já existe, e o serviço do backend continua sendo o dono da decisão.

## Tools — quem define é o backend

Este pacote **não sabe quais tools existem**. Na subida ele busca `GET /mcp/catalogo` e publica o que vier; a execução vai por `POST /mcp/executar`, e o backend resolve o nome para o serviço.

```
subida  ──> GET  /mcp/catalogo   → lista publicada em tools/list
chamada ──> POST /mcp/executar   → { name, args }
```

O motivo é operacional: antes, tool nova custava editar este pacote, buildar, commitar, publicar e reinstalar o MCP no Aurora — cinco passos para expor um endpoint que já existia no backend. Agora é commit de um módulo só, em `backend/src/mcp`.

A lista corrente sai de `GET /mcp/catalogo`. Não há cópia dela aqui de propósito: cópia envelhece e passa a mentir.

**Quando o catálogo não responde**, o servidor publica uma única tool, `funilaria_catalogo_indisponivel`, cuja descrição explica o que verificar. Sem ela o sintoma seria "sumiram as tools" e o diagnóstico começaria pelo lugar errado.

O catálogo é buscado **uma vez, na subida**: o cliente MCP lê `tools/list` logo após conectar e não volta a perguntar. Tool adicionada no backend entra na próxima reinstalação do servidor no Aurora.

## Autenticação

**Credencial de serviço com `shopId` explícito** é o caminho principal, tanto para escrever quanto para ler. Header `x-aurora-secret`, o mesmo valor de `AURORA_WEBHOOK_SECRET` no backend; ele não representa pessoa nenhuma, representa o serviço.

Uma IA que atende várias oficinas não tem sessão, então a oficina é **parâmetro**, nunca contexto implícito. Do lado do backend isso é o `@AllowService()` nas rotas de leitura de estoque: o `JwtAuthGuard` aceita o segredo no lugar do JWT e o `ShopContextGuard` passa a exigir o `shopId` — id inexistente responde `404 Oficina não encontrada`, e não uma lista vazia que se confundiria com "oficina sem estoque".

**Sessão de usuário** (JWT de `POST /auth/entrar`) continua existindo para os comandos de CLI, mas **não vale mais para as tools**: `POST /mcp/executar` é sempre chamada de serviço, e a oficina é sempre parâmetro explícito. Uma IA que atende várias oficinas nunca teve sessão; manter os dois modos só criava um caminho em que `shopId` omitido significava coisas diferentes.

### Configuração — env é o caminho principal

Em produção quem sobe este processo é o runtime do Aurora, que injeta as variáveis: **não há terminal, e nenhum comando de login é executado**. O servidor funciona com o disco totalmente vazio.

| Env | Apelido aceito | Para quê |
|---|---|---|
| `FUNILARIA_API_URL` | `PUBLIC_API_URL` | Base da API |
| `FUNILARIA_SERVICE_SECRET` | `AURORA_WEBHOOK_SECRET` | Segredo de serviço (`x-aurora-secret`) |
| `FUNILARIA_SIGNING_SECRET` | `AURORA_WEBHOOK_SIGNING_SECRET` | Segredo da assinatura HMAC (opcional) |
| `FUNILARIA_SHOP_ID` | — | Oficina padrão de `consultar_estoque` |
| `FUNILARIA_PERFIL` | — | Qual IA do conjunto este servidor atende: `pecas`, `estoque`. Sem definir, o catálogo vem inteiro |
| `FUNILARIA_TOKEN` | — | JWT de usuário, se houver (opcional) |

O `FUNILARIA_PERFIL` existe porque o Aurora liga **servidor inteiro** a uma IA —
não há filtro de tool por IA no painel dele. Então o escopo sai do catálogo: o
backend devolve só as tools daquele perfil, do mesmo jeito que o
`FUNILARIA_SHOP_ID` já limita a oficina. Assim a IA de peças não recebe
`lancar_consumo`, e a de estoque não recebe `responder_busca_peca`.

Perfil desconhecido vale como ausente e devolve tudo: atender demais é
recuperável, atender de menos deixa a IA sem ferramenta e o sintoma aparece
longe da causa. Por isso o `status` imprime o perfil que ele leu.

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
