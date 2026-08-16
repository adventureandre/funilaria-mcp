import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const TRANSFER_USER_RESOURCES_TOOL = {
  name: "transfer_user_resources",
  title: "Transfer resources between users",
  description:
    "Transfers all resources (AIs, MCP servers, providers) from one user to another. " +
    "Useful when removing a user or consolidating accounts. Requires master role.",
  inputSchema: {
    type: "object" as const,
    properties: {
      fromUserId: {
        type: "string",
        description: "The source user's ID (who currently owns the resources).",
      },
      toUserId: {
        type: "string",
        description: "The destination user's ID (who will receive the resources).",
      },
    },
    required: ["fromUserId", "toUserId"],
    additionalProperties: false,
  },
} as const;

export async function runTransferUserResources(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.fromUserId || typeof a.fromUserId !== "string")
    throw new Error("Parameter 'fromUserId' is required.");
  if (!a.toUserId || typeof a.toUserId !== "string")
    throw new Error("Parameter 'toUserId' is required.");
  return auroraRequest(
    creds,
    apiPath`/dashboard/users/${a.fromUserId}/transfer-to/${a.toUserId}`,
    { method: "POST" },
  );
}

export const TRANSFER_AIS_TOOL = {
  name: "transfer_ais",
  title: "Transfer selected AIs to a user",
  description:
    "Transfers ONLY the given AIs (by id) to another user, without moving MCP servers, " +
    "providers or the owner's other AIs. Use this to hand over a tenant's AIs. " +
    "Master transfers any AI to any user; an admin can only move AIs within their own tenant. " +
    "Requires master or admin role.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        description: "IDs of the AIs to transfer (use list_ais/get_ai_config to find them).",
      },
      toUserId: {
        type: "string",
        description: "The destination user's ID (who will receive the AIs).",
      },
    },
    required: ["aiIds", "toUserId"],
    additionalProperties: false,
  },
} as const;

export async function runTransferAis(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  const aiIds = Array.isArray(a.aiIds)
    ? a.aiIds.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  if (aiIds.length === 0)
    throw new Error("Parameter 'aiIds' must be a non-empty array of AI ids.");
  if (!a.toUserId || typeof a.toUserId !== "string")
    throw new Error("Parameter 'toUserId' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ais/transfer`, {
    method: "POST",
    body: { aiIds, toUserId: a.toUserId },
  });
}
