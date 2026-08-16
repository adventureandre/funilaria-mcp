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

A lista é **dinâmica**: no primeiro `tools/list` da sessão o cliente busca o
catálogo em `GET /dashboard/mcp-catalog` do seu Aurora e registra o que vier de
lá, junto das 23 tools que ainda vivem neste pacote (uploads, downloads e as
que combinam mais de uma chamada). Tool nova no backend aparece sem atualizar o
pacote; em caso de nome repetido, a versão do catálogo vence.

> **A partir da 0.7.0 o backend precisa expor o catálogo.** As tools que antes
> vinham embutidas foram movidas para lá — apontado para um Aurora anterior a
> essa mudança, o cliente mostra só as 23 locais e uma tool
> `aurora_catalog_unavailable` explicando o que fazer. Para seguir com o
> conjunto antigo embutido, fixe `@expertcustom/aurora-mcp@0.6.x`.

Os grupos abaixo refletem as tools locais desta versão.

| Categoria | Tools |
|-----------|-------|
| **IAs** | `list_ais`, `get_ai_config` |
| **Conversas** | `list_conversations`, `delete_conversation` |
| **Skills** | `list_skills`, `import_skill`, `export_skill` |
| **Skill Files** | `upload_skill_file` |
| **Embeddings** | `list_embeddings` |
| **Documents** | `upload_document` |
| **UI Actions** | `link_ui_action_to_ai`, `unlink_ui_action_from_ai`, `ui_action_stats` |
| **MCP Servers** | `link_mcp_server_to_ai`, `unlink_mcp_server_from_ai` |
| **Scheduled Tasks** | `list_schedules`, `get_schedule`, `create_schedule`, `update_schedule`, `delete_schedule` |
| **Documentos gerados** | `download_generated_doc` |
| **Settings** | `get_settings`, `update_settings` |

Todas as tools operam via API REST do Aurora. Credenciais de provider **nunca** são expostas.

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

## Exemplos: Agendar Tarefas com a IA

A tool `schedules` permite que a IA crie, liste e gerencie tarefas agendadas. Exemplo de conversa:

```
Usuário: "Agende uma tarefa para gerar o boletim todo dia às 8h"

Claude (usando schedules tool):
  create_schedule({
    aiId: "aurora-123",
    title: "Gerar boletim diário",
    instruction: "Gere o boletim com dados de hoje",
    deliveryType: "email",
    target: "diretor@empresa.com.br",
    preset: { kind: "daily", hour: 8, minute: 0 }
  })

Resultado: Tarefa criada e agendada ✓
```

Tipos de entrega:
- **`email`** — envia resultado por email (requer `target` com email válido)
- **`whatsapp`** — envia no WhatsApp (requer `target` com número/chatId e IA com provider ativo)
- **`internal`** — resultado fica no histórico da conversa (sem `target`)

Presets de recorrência:
- `{ kind: "daily", hour: 8, minute: 30 }` — todo dia às 8:30
- `{ kind: "weekly", weekday: 3, hour: 14, minute: 0 }` — quarta-feira às 14:00
- `{ kind: "monthly", day: 1, hour: 9, minute: 0 }` — 1º de cada mês às 9:00
- `{ kind: "hourly", everyHours: 3, minute: 15 }` — a cada 3 horas na marca :15

Mais exemplos no dashboard Aurora → aba "Agendamentos".

## Troubleshooting

- **`No Aurora credentials found`** — rode `npx @expertcustom/aurora-mcp login` primeiro.
- **`Aurora API error (401)`** — JWT expirou ou inválido. Refaça o login.
- **`Aurora API error (403)`** — sua role não tem `ia:read`. Fale com um admin.
- **`Aurora API error (404)` em `chat_with_ai`/`get_ai_config`** — `name` da IA não existe ou não pertence ao seu workspace. Confirme via `list_ais`.
- **`Aurora API error (409)` em `chat_with_ai`** — a IA está inativa ou sem credencial de provider. Ajuste no dashboard.
