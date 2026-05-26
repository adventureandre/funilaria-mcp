import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const TOKEN_USAGE_TOOL = {
  name: "token_usage",
  title: "Get token usage stats",
  description:
    "Returns token consumption statistics for the authenticated user's AIs.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export async function runTokenUsage(
  creds: Credentials,
): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/tokens");
}
