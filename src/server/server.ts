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

export async function startServer(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [LIST_AIS_TOOL, GET_AI_CONFIG_TOOL, CHAT_WITH_AI_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === LIST_AIS_TOOL.name) {
        const creds = await requireCredentials();
        const ais = await runListAis(
          creds,
          args as { includeInactive?: boolean } | undefined,
        );
        return jsonContent({ ais });
      }
      if (name === GET_AI_CONFIG_TOOL.name) {
        const creds = await requireCredentials();
        const ai = await runGetAiConfig(
          creds,
          args as { name?: unknown } | undefined,
        );
        return jsonContent({ ai });
      }
      if (name === CHAT_WITH_AI_TOOL.name) {
        const creds = await requireCredentials();
        const result = await runChatWithAi(creds, args);
        return jsonContent(result);
      }
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (err) {
      return errorContent(err);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
