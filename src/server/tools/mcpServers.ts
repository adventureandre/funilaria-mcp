import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_MCP_SERVERS_TOOL = {
  name: "list_mcp_servers",
  title: "List MCP Servers",
  description:
    "Lists MCP servers (tool providers) that AIs can use. " +
    "These are external processes that provide tools to the AI during conversations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      search: { type: "string", description: "Filter by name." },
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
    additionalProperties: false,
  },
} as const;

export const GET_MCP_SERVER_TOOL = {
  name: "get_mcp_server",
  title: "Get MCP Server details",
  description: "Returns full configuration of a MCP server by ID, including linked AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The MCP server's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const CREATE_MCP_SERVER_TOOL = {
  name: "create_mcp_server",
  title: "Create MCP Server",
  description:
    "Registers a new MCP server (tool provider) that can be linked to AIs. " +
    "Requires `name`, `displayName`, and `command`.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Unique slug." },
      displayName: { type: "string", description: "Human-friendly name." },
      description: { type: "string" },
      command: { type: "string", description: "Command to launch the server process." },
      args: { type: "array", items: { type: "string" }, description: "Command arguments." },
      env: { type: "object", additionalProperties: { type: "string" }, description: "Environment variables." },
      cwd: { type: "string", description: "Working directory." },
      gitUrl: { type: "string", description: "Source repo URL." },
      version: { type: "string" },
      timeout: { type: "integer", description: "Timeout in ms (default 30000)." },
    },
    required: ["name", "displayName", "command"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_MCP_SERVER_TOOL = {
  name: "update_mcp_server",
  title: "Update MCP Server",
  description: "Updates an existing MCP server configuration.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The MCP server's ID." },
      displayName: { type: "string" },
      description: { type: "string" },
      command: { type: "string" },
      args: { type: "array", items: { type: "string" } },
      env: { type: "object", additionalProperties: { type: "string" } },
      cwd: { type: "string" },
      gitUrl: { type: "string" },
      version: { type: "string" },
      timeout: { type: "integer" },
      isActive: { type: "boolean" },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_MCP_SERVER_TOOL = {
  name: "delete_mcp_server",
  title: "Delete MCP Server",
  description: "Permanently removes a MCP server and unlinks it from all AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The MCP server's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

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

export async function runListMcpServers(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const params = new URLSearchParams();
  if (a.page) params.set("page", String(a.page));
  if (a.limit) params.set("limit", String(a.limit));
  if (a.search && typeof a.search === "string") params.set("search", a.search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return auroraRequest(creds, `/dashboard/mcp${qs}`);
}

export async function runGetMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, `/dashboard/mcp/${a.id}`);
}

export async function runCreateMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.command || typeof a.command !== "string") throw new Error("Parameter 'command' is required.");
  return auroraRequest(creds, "/dashboard/mcp", { method: "POST", body: a });
}

export async function runUpdateMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, `/dashboard/mcp/${id}`, { method: "PUT", body });
}

export async function runDeleteMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, `/dashboard/mcp/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}

export async function runLinkMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.mcpId || typeof a.mcpId !== "string") throw new Error("Parameter 'mcpId' is required.");
  return auroraRequest(creds, `/dashboard/ia/${a.aiId}/mcp/${a.mcpId}`, { method: "POST" });
}

export async function runUnlinkMcpServer(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.mcpId || typeof a.mcpId !== "string") throw new Error("Parameter 'mcpId' is required.");
  await auroraRequest(creds, `/dashboard/ia/${a.aiId}/mcp/${a.mcpId}`, { method: "DELETE" });
  return { deleted: true };
}
