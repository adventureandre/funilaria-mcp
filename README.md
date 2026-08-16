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

## Tools disponíveis (129)

| Categoria | Tools |
|-----------|-------|
| **IAs** | `list_ais`, `get_ai_config`, `create_ai`, `update_ai`, `delete_ai` |
| **Chat** | `chat_with_ai` |
| **Conversas** | `list_conversations`, `get_conversation`, `delete_conversation`, `get_conversation_status`, `resume_conversation`, `close_conversation`, `handoff_ack`, `list_recent_conversations` |
| **Skills** | `list_skills`, `get_skill`, `create_skill`, `update_skill`, `delete_skill`, `import_skill`, `export_skill`, `approve_skill`, `reject_skill`, `move_skill` |
| **Skill Files** | `list_skill_files`, `get_skill_file`, `create_skill_file`, `update_skill_file`, `delete_skill_file`, `upload_skill_file` |
| **Embeddings** | `list_embeddings`, `create_embedding`, `update_embedding`, `delete_embedding`, `delete_all_embeddings`, `get_embedding_stats` |
| **Documents** | `list_documents`, `get_document`, `delete_document`, `upload_document` |
| **UI Actions** | `list_ui_actions`, `get_ui_action`, `create_ui_action`, `update_ui_action`, `delete_ui_action`, `link_ui_action_to_ai`, `update_ui_action_link`, `unlink_ui_action_from_ai`, `ui_action_stats` |
| **MCP Servers** | `list_mcp_servers`, `get_mcp_server`, `create_mcp_server`, `update_mcp_server`, `delete_mcp_server`, `reinstall_mcp_server`, `link_mcp_server_to_ai`, `unlink_mcp_server_from_ai` |
| **Providers (mensageria)** | `list_providers`, `get_provider`, `create_provider`, `update_provider`, `delete_provider`, `test_provider` |
| **Providers de LLM** | `list_llm_providers`, `get_llm_provider`, `create_llm_provider`, `update_llm_provider`, `delete_llm_provider`, `test_llm_provider` |
| **Providers de embedding** | `list_embedding_providers`, `get_embedding_provider`, `create_embedding_provider`, `update_embedding_provider`, `delete_embedding_provider`, `test_embedding_provider` |
| **Model discovery** | `list_provider_models` |
| **Scheduled Tasks** | `list_schedules`, `get_schedule`, `create_schedule`, `update_schedule`, `delete_schedule` |
| **Usuários** | `list_users`, `get_user`, `create_user`, `update_user`, `delete_user`, `get_user_permissions`, `set_user_permissions`, `impersonate_user`, `transfer_user_resources`, `get_me` |
| **Roles** | `list_roles`, `list_permissions`, `create_role`, `update_role_permissions`, `delete_role` |
| **Planos & assinaturas** | `get_my_plan`, `list_plans`, `create_plan`, `update_plan`, `deactivate_plan`, `get_plan_limits`, `update_plan_limits`, `get_owner_subscription`, `assign_subscription`, `cancel_subscription`, `list_subscriptions`, `subscriptions_trend`, `renew_subscription`, `subscription_history` |
| **Documentos gerados** | `list_generated_docs`, `generated_docs_stats`, `get_generated_doc`, `get_generated_doc_url`, `download_generated_doc`, `save_generated_doc`, `delete_generated_doc` |
| **WhatsApp** | `whatsapp_info`, `whatsapp_connect`, `whatsapp_disconnect` |
| **Settings** | `get_settings`, `update_settings` |
| **Audit & Erros** | `list_audit`, `list_error_logs` |
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
