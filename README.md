# @expertcustom/aurora-mcp

Servidor MCP (Model Context Protocol) que conecta Claude Code — e qualquer outro cliente MCP — às IAs do Aurora. Permite listar, inspecionar e conversar com as IAs configuradas no seu workspace Aurora diretamente do seu editor.

## Como funciona

```
Claude Code  ──stdio──>  npx @expertcustom/aurora-mcp  ──HTTPS+JWT──>  Aurora backend
```

As credenciais do provider (OpenAI/Claude/Gemini) ficam no backend, vinculadas a cada IA. O MCP nunca enxerga essas chaves — ele só repassa sua identidade Aurora (JWT) e o backend faz a chamada com a credencial da IA.

## Pré-requisitos

- Node.js ≥ 20
- Conta no Aurora com permissão `ia:read`
- URL do backend Aurora (ex: `https://ia.api.expertcustom.com.br`)

## Instalação

### 1) Login no Aurora

Uma vez por máquina:

```bash
npx @expertcustom/aurora-mcp login
```

O comando pergunta:

- **Aurora URL** — endpoint do backend (ex: `https://ia.api.expertcustom.com.br`)
- **Email** — seu email cadastrado no Aurora
- **Senha** — sua senha

O JWT fica salvo em `~/.config/aurora-mcp/credentials.json` (modo `0600`). Pra trocar de conta ou refazer o login, é só rodar de novo.

### 2) Registrar no Claude Code

Forma mais simples:

```bash
claude mcp add aurora -- npx -y @expertcustom/aurora-mcp
```

Ou edite manualmente o `~/.claude.json`, seção `mcpServers`:

```json
{
  "mcpServers": {
    "aurora": {
      "command": "npx",
      "args": ["-y", "@expertcustom/aurora-mcp"]
    }
  }
}
```

### 3) Verificar

Dentro do Claude Code, rode `/mcp` — deve aparecer `aurora` como **connected**.

## Tools disponíveis

### `list_ais`

Lista as IAs do Aurora que você tem permissão de usar.

**Parâmetros:**

- `includeInactive` *(boolean, opcional)* — se `true`, inclui IAs com `isActive: false`. Padrão: `false`.

**Retorna:** array de `{ name, displayName, description, provider, model, isActive }`.

### `get_ai_config`

Retorna a configuração completa de uma IA (sem expor credenciais).

**Parâmetros:**

- `name` *(string, obrigatório)* — `name` da IA, obtido via `list_ais`.

**Retorna:** `{ name, displayName, description, provider, model, modelVison, maxTokens, temperature, systemPrompt, embeddingEnabled, embeddingProvider, canLearnFromUsers, canAccessOtherAIs, promptShieldEnabled, handoffEnabled, isActive, createdAt, updatedAt }`.

Chaves de API (`token`, `apiKey`, `embeddingKey`, `geminiKey`) **nunca** são retornadas.

### `chat_with_ai`

Manda uma mensagem para uma IA e recebe a resposta. Stateless — nenhuma conversa é persistida no Aurora.

**Parâmetros:**

- `name` *(string, obrigatório)* — `name` da IA.
- `message` *(string, obrigatório)* — mensagem do usuário.
- `history` *(array, opcional)* — turnos anteriores: `[{ role: "user" | "assistant", content: string }]`, do mais antigo pro mais recente.
- `maxTokens` *(integer, opcional)* — sobrescreve o `maxTokens` configurado na IA.
- `temperature` *(number, opcional)* — sobrescreve a `temperature` configurada na IA (0..2).

**Retorna:** `{ content, usage: { promptTokens, completionTokens, totalTokens } | null }`.

O `systemPrompt` configurado na IA é injetado automaticamente pelo backend.

## Outros clientes MCP

Cursor, Continue, Cline e qualquer outro cliente MCP usam o mesmo formato — basta apontar o `command` para `npx` e os `args` para `["-y", "@expertcustom/aurora-mcp"]`.

## Trocar de ambiente / fazer logout

Refaça o login apontando para outra URL:

```bash
npx @expertcustom/aurora-mcp login
```

Pra remover as credenciais:

```bash
rm ~/.config/aurora-mcp/credentials.json
```

## Troubleshooting

- **`No Aurora credentials found`** — rode `npx @expertcustom/aurora-mcp login` primeiro.
- **`Aurora API error (401)`** — JWT expirou ou inválido. Refaça o login.
- **`Aurora API error (403)`** — sua role não tem `ia:read`. Fale com um admin.
- **`Aurora API error (404)` em `chat_with_ai`/`get_ai_config`** — `name` da IA não existe ou não pertence ao seu workspace. Confirme via `list_ais`.
- **`Aurora API error (409)` em `chat_with_ai`** — a IA está inativa ou sem credencial de provider. Ajuste no dashboard.
