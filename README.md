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

## Tools disponíveis (81)

| Categoria | Tools |
|-----------|-------|
| **IAs** | `list_ais`, `get_ai_config`, `create_ai`, `update_ai`, `delete_ai` |
| **Chat** | `chat_with_ai` |
| **Conversas** | `list_conversations`, `get_conversation`, `delete_conversation`, `get_conversation_status`, `resume_conversation`, `close_conversation`, `handoff_ack`, `list_recent_conversations` |
| **Skills** | `list_skills`, `get_skill`, `create_skill`, `update_skill`, `delete_skill`, `import_skill`, `export_skill`, `approve_skill`, `reject_skill`, `move_skill` |
| **Skill Files** | `list_skill_files`, `get_skill_file`, `create_skill_file`, `update_skill_file`, `delete_skill_file`, `upload_skill_file` |
| **Embeddings** | `list_embeddings`, `create_embedding`, `update_embedding`, `delete_embedding`, `delete_all_embeddings`, `get_embedding_stats` |
| **Documents** | `list_documents`, `get_document`, `delete_document`, `upload_document` |
| **UI Actions** | `list_ui_actions`, `get_ui_action`, `create_ui_action`, `update_ui_action`, `delete_ui_action`, `link_ui_action_to_ai`, `unlink_ui_action_from_ai`, `ui_action_stats` |
| **MCP Servers** | `list_mcp_servers`, `get_mcp_server`, `create_mcp_server`, `update_mcp_server`, `delete_mcp_server`, `link_mcp_server_to_ai`, `unlink_mcp_server_from_ai` |
| **Providers** | `list_providers`, `get_provider`, `create_provider`, `update_provider`, `delete_provider`, `test_provider` |
| **Usuários** | `list_users`, `get_user`, `create_user`, `update_user`, `delete_user`, `transfer_user_resources`, `get_me` |
| **Roles** | `list_roles`, `list_permissions`, `create_role`, `update_role_permissions`, `delete_role` |
| **Settings** | `get_settings`, `update_settings` |
| **Audit** | `list_audit` |
| **Token Usage** | `token_usage` |
| **Webhook Inspector** | `read_webhook_inspector`, `clear_webhook_inspector` |
| **Status** | `get_status` |

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

## Troubleshooting

- **`No Aurora credentials found`** — rode `npx @expertcustom/aurora-mcp login` primeiro.
- **`Aurora API error (401)`** — JWT expirou ou inválido. Refaça o login.
- **`Aurora API error (403)`** — sua role não tem `ia:read`. Fale com um admin.
- **`Aurora API error (404)` em `chat_with_ai`/`get_ai_config`** — `name` da IA não existe ou não pertence ao seu workspace. Confirme via `list_ais`.
- **`Aurora API error (409)` em `chat_with_ai`** — a IA está inativa ou sem credencial de provider. Ajuste no dashboard.
