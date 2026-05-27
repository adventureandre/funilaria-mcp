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
