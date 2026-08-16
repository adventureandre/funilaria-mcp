import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LINK_MCP_SERVER_TOOL = {
  name: "link_mcp_server_to_ai",
  title: "Link MCP Server to AI",
  description: "Associates a MCP server with an AI so it can use the server's tools.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      mcpId: { type: "string", description: "The MCP server's ID." },
    },
    required: ["aiId", "mcpId"],
    additionalProperties: false,
  },
} as const;

export const UNLINK_MCP_SERVER_TOOL = {
  name: "unlink_mcp_server_from_ai",
  title: "Unlink MCP Server from AI",
  description: "Removes the association between a MCP server and an AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      mcpId: { type: "string", description: "The MCP server's ID." },
    },
    required: ["aiId", "mcpId"],
    additionalProperties: false,
  },
} as const;

export async function runLinkMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.mcpId || typeof a.mcpId !== "string") throw new Error("Parameter 'mcpId' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/mcp/${a.mcpId}`, { method: "POST" });
}

export async function runUnlinkMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.mcpId || typeof a.mcpId !== "string") throw new Error("Parameter 'mcpId' is required.");
  await auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/mcp/${a.mcpId}`, { method: "DELETE" });
  return { deleted: true };
}
