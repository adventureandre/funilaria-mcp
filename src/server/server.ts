import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SERVER_NAME, SERVER_VERSION } from "../config.js";
import {
  loadCredentials,
  type Credentials,
} from "../auth/credentials.js";
import {
  AuroraApiError,
  AuthenticationRequiredError,
} from "../auth/client.js";

import {
  fetchRemoteTools, callRemoteTool, mergeTools,
  CATALOG_UNAVAILABLE_TOOL,
  type RemoteTool,
} from "./catalog/remoteCatalog.js";
import { LIST_AIS_TOOL, runListAis } from "./tools/listAis.js";
import { GET_AI_CONFIG_TOOL, runGetAiConfig } from "./tools/getAiConfig.js";
import { LIST_CONVERSATIONS_TOOL, runListConversations } from "./tools/listConversations.js";
import { DELETE_CONVERSATION_TOOL, runDeleteConversation } from "./tools/deleteConversation.js";
import { LIST_SKILLS_TOOL, runListSkills } from "./tools/listSkills.js";
import {
  IMPORT_SKILL_TOOL, runImportSkill,
  EXPORT_SKILL_TOOL, runExportSkill,
} from "./tools/manageSkill.js";
import {
  LIST_EMBEDDINGS_TOOL, runListEmbeddings,
} from "./tools/embeddings.js";
import {
  GET_SETTINGS_TOOL, runGetSettings,
  UPDATE_SETTINGS_TOOL, runUpdateSettings,
} from "./tools/settings.js";
import {
  LINK_UI_ACTION_TOOL, runLinkUiAction,
  UNLINK_UI_ACTION_TOOL, runUnlinkUiAction,
  UI_ACTION_STATS_TOOL, runUiActionStats,
} from "./tools/uiActions.js";
import {
  LINK_MCP_SERVER_TOOL, runLinkMcpServer,
  UNLINK_MCP_SERVER_TOOL, runUnlinkMcpServer,
} from "./tools/mcpServers.js";
import {
  DOWNLOAD_GENERATED_DOC_TOOL, runDownloadGeneratedDoc,
} from "./tools/generatedDocs.js";
import { UPLOAD_DOCUMENT_TOOL, runUploadDocument } from "./tools/uploadDocument.js";
import { UPLOAD_SKILL_FILE_TOOL, runUploadSkillFile } from "./tools/uploadSkillFile.js";
import {
  LIST_SCHEDULES_TOOL, runListSchedules,
  GET_SCHEDULE_TOOL, runGetSchedule,
  CREATE_SCHEDULE_TOOL, runCreateSchedule,
  UPDATE_SCHEDULE_TOOL, runUpdateSchedule,
  DELETE_SCHEDULE_TOOL, runDeleteSchedule,
} from "./tools/schedules.js";

async function requireCredentials(): Promise<Credentials> {
  const creds = await loadCredentials();
  if (!creds) throw new AuthenticationRequiredError();
  return creds;
}

function errorContent(err: unknown): { content: any[]; isError: true } {
  let message: string;
  if (err instanceof AuthenticationRequiredError) {
    message = err.message;
  } else if (err instanceof AuroraApiError) {
    message = `Aurora API error (${err.status}): ${err.message}`;
  } else if (err instanceof Error) {
    message = err.message;
  } else {
    message = String(err);
  }
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

function jsonContent(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

const ALL_TOOLS = [
  // IAs
  LIST_AIS_TOOL,
  GET_AI_CONFIG_TOOL,
  // Conversations
  LIST_CONVERSATIONS_TOOL,
  DELETE_CONVERSATION_TOOL,
  // Skills
  LIST_SKILLS_TOOL,
  IMPORT_SKILL_TOOL,
  EXPORT_SKILL_TOOL,
  // Skill Files
  // Embeddings
  LIST_EMBEDDINGS_TOOL,
  // Documents
  // UI Actions
  LINK_UI_ACTION_TOOL,
  UNLINK_UI_ACTION_TOOL,
  UI_ACTION_STATS_TOOL,
  // MCP Servers
  LINK_MCP_SERVER_TOOL,
  UNLINK_MCP_SERVER_TOOL,
  // Providers
  // Settings
  GET_SETTINGS_TOOL,
  UPDATE_SETTINGS_TOOL,
  // Users
  // Roles & Permissions
  // Plans & Subscriptions
  // Generated Documents
  DOWNLOAD_GENERATED_DOC_TOOL,
  // WhatsApp
  // Error logs & model discovery
  // Auth & Status
  // Audit
  // Webhook Inspector
  // Tokens
  // Extra
  UPLOAD_DOCUMENT_TOOL,
  UPLOAD_SKILL_FILE_TOOL,
  // Schedules
  LIST_SCHEDULES_TOOL,
  GET_SCHEDULE_TOOL,
  CREATE_SCHEDULE_TOOL,
  UPDATE_SCHEDULE_TOOL,
  DELETE_SCHEDULE_TOOL,
];

type ToolHandler = (creds: Credentials, args: unknown) => Promise<unknown>;

const HANDLERS: Record<string, ToolHandler> = {
  [LIST_AIS_TOOL.name]: (c, a) => runListAis(c, a as any),
  [GET_AI_CONFIG_TOOL.name]: (c, a) => runGetAiConfig(c, a as any),
  [LIST_CONVERSATIONS_TOOL.name]: runListConversations,
  [DELETE_CONVERSATION_TOOL.name]: runDeleteConversation,
  [LIST_SKILLS_TOOL.name]: runListSkills,
  [IMPORT_SKILL_TOOL.name]: runImportSkill,
  [EXPORT_SKILL_TOOL.name]: runExportSkill,
  [LIST_EMBEDDINGS_TOOL.name]: runListEmbeddings,
  [LINK_UI_ACTION_TOOL.name]: runLinkUiAction,
  [UNLINK_UI_ACTION_TOOL.name]: runUnlinkUiAction,
  [UI_ACTION_STATS_TOOL.name]: runUiActionStats,
  [LINK_MCP_SERVER_TOOL.name]: runLinkMcpServer,
  [UNLINK_MCP_SERVER_TOOL.name]: runUnlinkMcpServer,
  [GET_SETTINGS_TOOL.name]: runGetSettings,
  [UPDATE_SETTINGS_TOOL.name]: runUpdateSettings,
  [DOWNLOAD_GENERATED_DOC_TOOL.name]: runDownloadGeneratedDoc,
  [UPLOAD_DOCUMENT_TOOL.name]: runUploadDocument,
  [UPLOAD_SKILL_FILE_TOOL.name]: runUploadSkillFile,
  [LIST_SCHEDULES_TOOL.name]: runListSchedules,
  [GET_SCHEDULE_TOOL.name]: runGetSchedule,
  [CREATE_SCHEDULE_TOOL.name]: runCreateSchedule,
  [UPDATE_SCHEDULE_TOOL.name]: runUpdateSchedule,
  [DELETE_SCHEDULE_TOOL.name]: runDeleteSchedule,
};

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  // Cache do catálogo por sessão: uma busca no primeiro tools/list. O editor
  // reconecta com frequência, e uma ida ao backend por listagem seria ruído.
  let remoteTools: RemoteTool[] | null = null;
  let catalogoOk = true;
  let remoteNames = new Set<string>();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    if (remoteTools === null) {
      try {
        const creds = await requireCredentials();
        const res = await fetchRemoteTools(creds);
        remoteTools = res.tools;
        catalogoOk = res.ok;
      } catch {
        // Sem credencial ainda: nova tentativa no próximo tools/list, depois
        // do login. Não é falha do catálogo, então não mostra a sentinela.
        return { tools: ALL_TOOLS };
      }
    }
    const merged = mergeTools(ALL_TOOLS, remoteTools);
    remoteNames = merged.remoteNames;
    return {
      tools: catalogoOk ? merged.tools : [...merged.tools, CATALOG_UNAVAILABLE_TOOL],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === CATALOG_UNAVAILABLE_TOOL.name) {
      return jsonContent({ error: CATALOG_UNAVAILABLE_TOOL.description });
    }

    // Tool servida pelo catálogo: executa pelo nome, o backend resolve a rota.
    if (remoteNames.has(name)) {
      try {
        const creds = await requireCredentials();
        return jsonContent(await callRemoteTool(creds, name, args));
      } catch (err) {
        return errorContent(err);
      }
    }

    const handler = HANDLERS[name];
    if (!handler) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      const creds = await requireCredentials();
      const result = await handler(creds, args);
      return jsonContent(result);
    } catch (err) {
      return errorContent(err);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
