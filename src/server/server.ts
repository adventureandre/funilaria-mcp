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

import { LIST_AIS_TOOL, runListAis } from "./tools/listAis.js";
import { GET_AI_CONFIG_TOOL, runGetAiConfig } from "./tools/getAiConfig.js";
import { CHAT_WITH_AI_TOOL, runChatWithAi } from "./tools/chatWithAi.js";
import { CREATE_AI_TOOL, runCreateAi } from "./tools/createAi.js";
import { UPDATE_AI_TOOL, runUpdateAi } from "./tools/updateAi.js";
import { DELETE_AI_TOOL, runDeleteAi } from "./tools/deleteAi.js";
import { LIST_CONVERSATIONS_TOOL, runListConversations } from "./tools/listConversations.js";
import { GET_CONVERSATION_TOOL, runGetConversation } from "./tools/getConversation.js";
import { DELETE_CONVERSATION_TOOL, runDeleteConversation } from "./tools/deleteConversation.js";
import {
  GET_CONVERSATION_STATUS_TOOL, runGetConversationStatus,
  RESUME_CONVERSATION_TOOL, runResumeConversation,
  CLOSE_CONVERSATION_TOOL, runCloseConversation,
  HANDOFF_ACK_TOOL, runHandoffAck,
} from "./tools/conversationStatus.js";
import { LIST_SKILLS_TOOL, runListSkills } from "./tools/listSkills.js";
import {
  CREATE_SKILL_TOOL, runCreateSkill,
  UPDATE_SKILL_TOOL, runUpdateSkill,
  DELETE_SKILL_TOOL, runDeleteSkill,
} from "./tools/manageSkill.js";
import {
  LIST_EMBEDDINGS_TOOL, runListEmbeddings,
  CREATE_EMBEDDING_TOOL, runCreateEmbedding,
  UPDATE_EMBEDDING_TOOL, runUpdateEmbedding,
  DELETE_EMBEDDING_TOOL, runDeleteEmbedding,
} from "./tools/embeddings.js";
import {
  LIST_DOCUMENTS_TOOL, runListDocuments,
  DELETE_DOCUMENT_TOOL, runDeleteDocument,
} from "./tools/documents.js";
import { TOKEN_USAGE_TOOL, runTokenUsage } from "./tools/tokenUsage.js";
import {
  LIST_PROVIDERS_TOOL, runListProviders,
  TEST_PROVIDER_TOOL, runTestProvider,
} from "./tools/providers.js";
import {
  GET_SETTINGS_TOOL, runGetSettings,
  UPDATE_SETTINGS_TOOL, runUpdateSettings,
} from "./tools/settings.js";
import {
  LIST_UI_ACTIONS_TOOL, runListUiActions,
  GET_UI_ACTION_TOOL, runGetUiAction,
  CREATE_UI_ACTION_TOOL, runCreateUiAction,
  UPDATE_UI_ACTION_TOOL, runUpdateUiAction,
  DELETE_UI_ACTION_TOOL, runDeleteUiAction,
  LINK_UI_ACTION_TOOL, runLinkUiAction,
  UNLINK_UI_ACTION_TOOL, runUnlinkUiAction,
  UI_ACTION_STATS_TOOL, runUiActionStats,
} from "./tools/uiActions.js";
import {
  LIST_MCP_SERVERS_TOOL, runListMcpServers,
  GET_MCP_SERVER_TOOL, runGetMcpServer,
  CREATE_MCP_SERVER_TOOL, runCreateMcpServer,
  UPDATE_MCP_SERVER_TOOL, runUpdateMcpServer,
  DELETE_MCP_SERVER_TOOL, runDeleteMcpServer,
  LINK_MCP_SERVER_TOOL, runLinkMcpServer,
  UNLINK_MCP_SERVER_TOOL, runUnlinkMcpServer,
} from "./tools/mcpServers.js";
import {
  LIST_USERS_TOOL, runListUsers,
  GET_USER_TOOL, runGetUser,
} from "./tools/users.js";

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
  CHAT_WITH_AI_TOOL,
  CREATE_AI_TOOL,
  UPDATE_AI_TOOL,
  DELETE_AI_TOOL,
  // Conversations
  LIST_CONVERSATIONS_TOOL,
  GET_CONVERSATION_TOOL,
  DELETE_CONVERSATION_TOOL,
  GET_CONVERSATION_STATUS_TOOL,
  RESUME_CONVERSATION_TOOL,
  CLOSE_CONVERSATION_TOOL,
  HANDOFF_ACK_TOOL,
  // Skills
  LIST_SKILLS_TOOL,
  CREATE_SKILL_TOOL,
  UPDATE_SKILL_TOOL,
  DELETE_SKILL_TOOL,
  // Embeddings
  LIST_EMBEDDINGS_TOOL,
  CREATE_EMBEDDING_TOOL,
  UPDATE_EMBEDDING_TOOL,
  DELETE_EMBEDDING_TOOL,
  // Documents
  LIST_DOCUMENTS_TOOL,
  DELETE_DOCUMENT_TOOL,
  // UI Actions
  LIST_UI_ACTIONS_TOOL,
  GET_UI_ACTION_TOOL,
  CREATE_UI_ACTION_TOOL,
  UPDATE_UI_ACTION_TOOL,
  DELETE_UI_ACTION_TOOL,
  LINK_UI_ACTION_TOOL,
  UNLINK_UI_ACTION_TOOL,
  UI_ACTION_STATS_TOOL,
  // MCP Servers
  LIST_MCP_SERVERS_TOOL,
  GET_MCP_SERVER_TOOL,
  CREATE_MCP_SERVER_TOOL,
  UPDATE_MCP_SERVER_TOOL,
  DELETE_MCP_SERVER_TOOL,
  LINK_MCP_SERVER_TOOL,
  UNLINK_MCP_SERVER_TOOL,
  // Providers
  LIST_PROVIDERS_TOOL,
  TEST_PROVIDER_TOOL,
  // Settings
  GET_SETTINGS_TOOL,
  UPDATE_SETTINGS_TOOL,
  // Users
  LIST_USERS_TOOL,
  GET_USER_TOOL,
  // Tokens
  TOKEN_USAGE_TOOL,
];

type ToolHandler = (creds: Credentials, args: unknown) => Promise<unknown>;

const HANDLERS: Record<string, ToolHandler> = {
  [LIST_AIS_TOOL.name]: (c, a) => runListAis(c, a as any),
  [GET_AI_CONFIG_TOOL.name]: (c, a) => runGetAiConfig(c, a as any),
  [CHAT_WITH_AI_TOOL.name]: runChatWithAi,
  [CREATE_AI_TOOL.name]: runCreateAi,
  [UPDATE_AI_TOOL.name]: runUpdateAi,
  [DELETE_AI_TOOL.name]: runDeleteAi,
  [LIST_CONVERSATIONS_TOOL.name]: runListConversations,
  [GET_CONVERSATION_TOOL.name]: runGetConversation,
  [DELETE_CONVERSATION_TOOL.name]: runDeleteConversation,
  [GET_CONVERSATION_STATUS_TOOL.name]: runGetConversationStatus,
  [RESUME_CONVERSATION_TOOL.name]: runResumeConversation,
  [CLOSE_CONVERSATION_TOOL.name]: runCloseConversation,
  [HANDOFF_ACK_TOOL.name]: runHandoffAck,
  [LIST_SKILLS_TOOL.name]: runListSkills,
  [CREATE_SKILL_TOOL.name]: runCreateSkill,
  [UPDATE_SKILL_TOOL.name]: runUpdateSkill,
  [DELETE_SKILL_TOOL.name]: runDeleteSkill,
  [LIST_EMBEDDINGS_TOOL.name]: runListEmbeddings,
  [CREATE_EMBEDDING_TOOL.name]: runCreateEmbedding,
  [UPDATE_EMBEDDING_TOOL.name]: runUpdateEmbedding,
  [DELETE_EMBEDDING_TOOL.name]: runDeleteEmbedding,
  [LIST_DOCUMENTS_TOOL.name]: runListDocuments,
  [DELETE_DOCUMENT_TOOL.name]: runDeleteDocument,
  [LIST_UI_ACTIONS_TOOL.name]: runListUiActions,
  [GET_UI_ACTION_TOOL.name]: runGetUiAction,
  [CREATE_UI_ACTION_TOOL.name]: runCreateUiAction,
  [UPDATE_UI_ACTION_TOOL.name]: runUpdateUiAction,
  [DELETE_UI_ACTION_TOOL.name]: runDeleteUiAction,
  [LINK_UI_ACTION_TOOL.name]: runLinkUiAction,
  [UNLINK_UI_ACTION_TOOL.name]: runUnlinkUiAction,
  [UI_ACTION_STATS_TOOL.name]: runUiActionStats,
  [LIST_MCP_SERVERS_TOOL.name]: runListMcpServers,
  [GET_MCP_SERVER_TOOL.name]: runGetMcpServer,
  [CREATE_MCP_SERVER_TOOL.name]: runCreateMcpServer,
  [UPDATE_MCP_SERVER_TOOL.name]: runUpdateMcpServer,
  [DELETE_MCP_SERVER_TOOL.name]: runDeleteMcpServer,
  [LINK_MCP_SERVER_TOOL.name]: runLinkMcpServer,
  [UNLINK_MCP_SERVER_TOOL.name]: runUnlinkMcpServer,
  [LIST_PROVIDERS_TOOL.name]: (_c) => runListProviders(_c),
  [TEST_PROVIDER_TOOL.name]: runTestProvider,
  [GET_SETTINGS_TOOL.name]: runGetSettings,
  [UPDATE_SETTINGS_TOOL.name]: runUpdateSettings,
  [LIST_USERS_TOOL.name]: runListUsers,
  [GET_USER_TOOL.name]: runGetUser,
  [TOKEN_USAGE_TOOL.name]: (_c) => runTokenUsage(_c),
};

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
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
