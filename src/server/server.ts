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
  GET_SKILL_TOOL, runGetSkill,
  DELETE_SKILL_TOOL, runDeleteSkill,
  IMPORT_SKILL_TOOL, runImportSkill,
  EXPORT_SKILL_TOOL, runExportSkill,
  APPROVE_SKILL_TOOL, runApproveSkill,
  REJECT_SKILL_TOOL, runRejectSkill,
  MOVE_SKILL_TOOL, runMoveSkill,
} from "./tools/manageSkill.js";
import {
  LIST_EMBEDDINGS_TOOL, runListEmbeddings,
  CREATE_EMBEDDING_TOOL, runCreateEmbedding,
  UPDATE_EMBEDDING_TOOL, runUpdateEmbedding,
  DELETE_EMBEDDING_TOOL, runDeleteEmbedding,
  DELETE_ALL_EMBEDDINGS_TOOL, runDeleteAllEmbeddings,
} from "./tools/embeddings.js";
import {
  LIST_DOCUMENTS_TOOL, runListDocuments,
  GET_DOCUMENT_TOOL, runGetDocument,
  DELETE_DOCUMENT_TOOL, runDeleteDocument,
} from "./tools/documents.js";
import { TOKEN_USAGE_TOOL, runTokenUsage } from "./tools/tokenUsage.js";
import {
  LIST_PROVIDERS_TOOL, runListProviders,
  TEST_PROVIDER_TOOL, runTestProvider,
  GET_PROVIDER_TOOL, runGetProvider,
  CREATE_PROVIDER_TOOL, runCreateProvider,
  UPDATE_PROVIDER_TOOL, runUpdateProvider,
  DELETE_PROVIDER_TOOL, runDeleteProvider,
} from "./tools/providers.js";
import {
  LIST_LLM_PROVIDERS_TOOL, runListLlmProviders,
  GET_LLM_PROVIDER_TOOL, runGetLlmProvider,
  CREATE_LLM_PROVIDER_TOOL, runCreateLlmProvider,
  UPDATE_LLM_PROVIDER_TOOL, runUpdateLlmProvider,
  DELETE_LLM_PROVIDER_TOOL, runDeleteLlmProvider,
  TEST_LLM_PROVIDER_TOOL, runTestLlmProvider,
} from "./tools/llmProviders.js";
import {
  LIST_EMBEDDING_PROVIDERS_TOOL, runListEmbeddingProviders,
  GET_EMBEDDING_PROVIDER_TOOL, runGetEmbeddingProvider,
  CREATE_EMBEDDING_PROVIDER_TOOL, runCreateEmbeddingProvider,
  UPDATE_EMBEDDING_PROVIDER_TOOL, runUpdateEmbeddingProvider,
  DELETE_EMBEDDING_PROVIDER_TOOL, runDeleteEmbeddingProvider,
  TEST_EMBEDDING_PROVIDER_TOOL, runTestEmbeddingProvider,
} from "./tools/embeddingProviders.js";
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
  CREATE_USER_TOOL, runCreateUser,
  UPDATE_USER_TOOL, runUpdateUser,
  DELETE_USER_TOOL, runDeleteUser,
} from "./tools/users.js";
import {
  LIST_SKILL_FILES_TOOL, runListSkillFiles,
  GET_SKILL_FILE_TOOL, runGetSkillFile,
  CREATE_SKILL_FILE_TOOL, runCreateSkillFile,
  UPDATE_SKILL_FILE_TOOL, runUpdateSkillFile,
  DELETE_SKILL_FILE_TOOL, runDeleteSkillFile,
} from "./tools/skillFiles.js";
import {
  LIST_ROLES_TOOL, runListRoles,
  LIST_PERMISSIONS_TOOL, runListPermissions,
  CREATE_ROLE_TOOL, runCreateRole,
  UPDATE_ROLE_PERMISSIONS_TOOL, runUpdateRolePermissions,
  DELETE_ROLE_TOOL, runDeleteRole,
} from "./tools/roles.js";
import { LIST_AUDIT_TOOL, runListAudit } from "./tools/audit.js";
import {
  READ_WEBHOOK_INSPECTOR_TOOL, runReadWebhookInspector,
  CLEAR_WEBHOOK_INSPECTOR_TOOL, runClearWebhookInspector,
} from "./tools/webhookInspector.js";
import {
  GET_ME_TOOL, runGetMe,
  GET_STATUS_TOOL, runGetStatus,
} from "./tools/status.js";
import { LIST_RECENT_CONVERSATIONS_TOOL, runListRecentConversations } from "./tools/recentConversations.js";
import { GET_CHAT_HISTORY_TOOL, runGetChatHistory } from "./tools/chatHistory.js";
import { GET_EMBEDDING_STATS_TOOL, runGetEmbeddingStats } from "./tools/embeddingStats.js";
import { UPLOAD_DOCUMENT_TOOL, runUploadDocument } from "./tools/uploadDocument.js";
import { UPLOAD_SKILL_FILE_TOOL, runUploadSkillFile } from "./tools/uploadSkillFile.js";
import { TRANSFER_USER_RESOURCES_TOOL, runTransferUserResources } from "./tools/transferUser.js";

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
  GET_SKILL_TOOL,
  CREATE_SKILL_TOOL,
  UPDATE_SKILL_TOOL,
  DELETE_SKILL_TOOL,
  IMPORT_SKILL_TOOL,
  EXPORT_SKILL_TOOL,
  APPROVE_SKILL_TOOL,
  REJECT_SKILL_TOOL,
  MOVE_SKILL_TOOL,
  // Skill Files
  LIST_SKILL_FILES_TOOL,
  GET_SKILL_FILE_TOOL,
  CREATE_SKILL_FILE_TOOL,
  UPDATE_SKILL_FILE_TOOL,
  DELETE_SKILL_FILE_TOOL,
  // Embeddings
  LIST_EMBEDDINGS_TOOL,
  CREATE_EMBEDDING_TOOL,
  UPDATE_EMBEDDING_TOOL,
  DELETE_EMBEDDING_TOOL,
  DELETE_ALL_EMBEDDINGS_TOOL,
  // Documents
  LIST_DOCUMENTS_TOOL,
  GET_DOCUMENT_TOOL,
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
  GET_PROVIDER_TOOL,
  CREATE_PROVIDER_TOOL,
  UPDATE_PROVIDER_TOOL,
  DELETE_PROVIDER_TOOL,
  TEST_PROVIDER_TOOL,
  LIST_LLM_PROVIDERS_TOOL,
  GET_LLM_PROVIDER_TOOL,
  CREATE_LLM_PROVIDER_TOOL,
  UPDATE_LLM_PROVIDER_TOOL,
  DELETE_LLM_PROVIDER_TOOL,
  TEST_LLM_PROVIDER_TOOL,
  LIST_EMBEDDING_PROVIDERS_TOOL,
  GET_EMBEDDING_PROVIDER_TOOL,
  CREATE_EMBEDDING_PROVIDER_TOOL,
  UPDATE_EMBEDDING_PROVIDER_TOOL,
  DELETE_EMBEDDING_PROVIDER_TOOL,
  TEST_EMBEDDING_PROVIDER_TOOL,
  // Settings
  GET_SETTINGS_TOOL,
  UPDATE_SETTINGS_TOOL,
  // Users
  LIST_USERS_TOOL,
  GET_USER_TOOL,
  CREATE_USER_TOOL,
  UPDATE_USER_TOOL,
  DELETE_USER_TOOL,
  // Roles & Permissions
  LIST_ROLES_TOOL,
  LIST_PERMISSIONS_TOOL,
  CREATE_ROLE_TOOL,
  UPDATE_ROLE_PERMISSIONS_TOOL,
  DELETE_ROLE_TOOL,
  // Auth & Status
  GET_ME_TOOL,
  GET_STATUS_TOOL,
  // Audit
  LIST_AUDIT_TOOL,
  // Webhook Inspector
  READ_WEBHOOK_INSPECTOR_TOOL,
  CLEAR_WEBHOOK_INSPECTOR_TOOL,
  // Tokens
  TOKEN_USAGE_TOOL,
  // Extra
  LIST_RECENT_CONVERSATIONS_TOOL,
  GET_CHAT_HISTORY_TOOL,
  GET_EMBEDDING_STATS_TOOL,
  UPLOAD_DOCUMENT_TOOL,
  UPLOAD_SKILL_FILE_TOOL,
  TRANSFER_USER_RESOURCES_TOOL,
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
  [GET_SKILL_TOOL.name]: runGetSkill,
  [CREATE_SKILL_TOOL.name]: runCreateSkill,
  [UPDATE_SKILL_TOOL.name]: runUpdateSkill,
  [DELETE_SKILL_TOOL.name]: runDeleteSkill,
  [IMPORT_SKILL_TOOL.name]: runImportSkill,
  [EXPORT_SKILL_TOOL.name]: runExportSkill,
  [APPROVE_SKILL_TOOL.name]: runApproveSkill,
  [REJECT_SKILL_TOOL.name]: runRejectSkill,
  [MOVE_SKILL_TOOL.name]: runMoveSkill,
  [LIST_SKILL_FILES_TOOL.name]: runListSkillFiles,
  [GET_SKILL_FILE_TOOL.name]: runGetSkillFile,
  [CREATE_SKILL_FILE_TOOL.name]: runCreateSkillFile,
  [UPDATE_SKILL_FILE_TOOL.name]: runUpdateSkillFile,
  [DELETE_SKILL_FILE_TOOL.name]: runDeleteSkillFile,
  [LIST_EMBEDDINGS_TOOL.name]: runListEmbeddings,
  [CREATE_EMBEDDING_TOOL.name]: runCreateEmbedding,
  [UPDATE_EMBEDDING_TOOL.name]: runUpdateEmbedding,
  [DELETE_EMBEDDING_TOOL.name]: runDeleteEmbedding,
  [DELETE_ALL_EMBEDDINGS_TOOL.name]: runDeleteAllEmbeddings,
  [LIST_DOCUMENTS_TOOL.name]: runListDocuments,
  [GET_DOCUMENT_TOOL.name]: runGetDocument,
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
  [GET_PROVIDER_TOOL.name]: runGetProvider,
  [CREATE_PROVIDER_TOOL.name]: runCreateProvider,
  [UPDATE_PROVIDER_TOOL.name]: runUpdateProvider,
  [DELETE_PROVIDER_TOOL.name]: runDeleteProvider,
  [TEST_PROVIDER_TOOL.name]: runTestProvider,
  [LIST_LLM_PROVIDERS_TOOL.name]: (_c) => runListLlmProviders(_c),
  [GET_LLM_PROVIDER_TOOL.name]: runGetLlmProvider,
  [CREATE_LLM_PROVIDER_TOOL.name]: runCreateLlmProvider,
  [UPDATE_LLM_PROVIDER_TOOL.name]: runUpdateLlmProvider,
  [DELETE_LLM_PROVIDER_TOOL.name]: runDeleteLlmProvider,
  [TEST_LLM_PROVIDER_TOOL.name]: runTestLlmProvider,
  [LIST_EMBEDDING_PROVIDERS_TOOL.name]: (_c) => runListEmbeddingProviders(_c),
  [GET_EMBEDDING_PROVIDER_TOOL.name]: runGetEmbeddingProvider,
  [CREATE_EMBEDDING_PROVIDER_TOOL.name]: runCreateEmbeddingProvider,
  [UPDATE_EMBEDDING_PROVIDER_TOOL.name]: runUpdateEmbeddingProvider,
  [DELETE_EMBEDDING_PROVIDER_TOOL.name]: runDeleteEmbeddingProvider,
  [TEST_EMBEDDING_PROVIDER_TOOL.name]: runTestEmbeddingProvider,
  [GET_SETTINGS_TOOL.name]: runGetSettings,
  [UPDATE_SETTINGS_TOOL.name]: runUpdateSettings,
  [LIST_USERS_TOOL.name]: runListUsers,
  [GET_USER_TOOL.name]: runGetUser,
  [CREATE_USER_TOOL.name]: runCreateUser,
  [UPDATE_USER_TOOL.name]: runUpdateUser,
  [DELETE_USER_TOOL.name]: runDeleteUser,
  [LIST_ROLES_TOOL.name]: (_c) => runListRoles(_c),
  [LIST_PERMISSIONS_TOOL.name]: (_c) => runListPermissions(_c),
  [CREATE_ROLE_TOOL.name]: runCreateRole,
  [UPDATE_ROLE_PERMISSIONS_TOOL.name]: runUpdateRolePermissions,
  [DELETE_ROLE_TOOL.name]: runDeleteRole,
  [GET_ME_TOOL.name]: (_c) => runGetMe(_c),
  [GET_STATUS_TOOL.name]: (_c) => runGetStatus(_c),
  [LIST_AUDIT_TOOL.name]: runListAudit,
  [READ_WEBHOOK_INSPECTOR_TOOL.name]: runReadWebhookInspector,
  [CLEAR_WEBHOOK_INSPECTOR_TOOL.name]: runClearWebhookInspector,
  [TOKEN_USAGE_TOOL.name]: (_c) => runTokenUsage(_c),
  [LIST_RECENT_CONVERSATIONS_TOOL.name]: runListRecentConversations,
  [GET_CHAT_HISTORY_TOOL.name]: runGetChatHistory,
  [GET_EMBEDDING_STATS_TOOL.name]: runGetEmbeddingStats,
  [UPLOAD_DOCUMENT_TOOL.name]: runUploadDocument,
  [UPLOAD_SKILL_FILE_TOOL.name]: runUploadSkillFile,
  [TRANSFER_USER_RESOURCES_TOOL.name]: runTransferUserResources,
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
