import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_PROVIDERS_TOOL = {
  name: "list_providers",
  title: "List configured providers",
  description:
    "Returns the messaging/LLM providers configured in Aurora.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    additionalProperties: false,
  },
} as const;

export const TEST_PROVIDER_TOOL = {
  name: "test_provider",
  title: "Test a provider connection",
  description:
    "Tests connectivity to a configured provider by ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runListProviders(
  creds: Credentials,
): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/providers");
}

export async function runTestProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, `/dashboard/providers/${a.id}/test`);
}
