import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const DELETE_AI_TOOL = {
  name: "delete_ai",
  title: "Delete an Aurora AI",
  description:
    "Permanently deletes an Aurora AI by ID. This is irreversible. " +
    "Use `list_ais` to find the AI's ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The AI's unique ID.",
      },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runDeleteAi(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") {
    throw new Error("Parameter 'id' is required.");
  }
  await auroraRequest(creds, apiPath`/dashboard/ia/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
