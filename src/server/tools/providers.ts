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

export const GET_PROVIDER_TOOL = {
  name: "get_provider",
  title: "Get provider details",
  description: "Returns the full configuration of a specific provider.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const CREATE_PROVIDER_TOOL = {
  name: "create_provider",
  title: "Create a provider",
  description: "Registers a new messaging/LLM provider in Aurora.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Provider name/slug." },
      type: { type: "string", description: "Provider type (e.g. 'openai', 'anthropic', 'custom')." },
      config: { type: "object", description: "Provider configuration (API keys, endpoints, etc).", additionalProperties: true },
    },
    required: ["name", "type"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_PROVIDER_TOOL = {
  name: "update_provider",
  title: "Update a provider",
  description: "Updates an existing provider's configuration.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The provider's ID." },
      name: { type: "string" },
      type: { type: "string" },
      config: { type: "object", additionalProperties: true },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_PROVIDER_TOOL = {
  name: "delete_provider",
  title: "Delete a provider",
  description: "Removes a provider from Aurora.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The provider's ID." },
    },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

export async function runTestProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, `/dashboard/providers/${a.id}/test`);
}

export async function runGetProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, `/dashboard/providers/${a.id}`);
}

export async function runCreateProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.name || typeof a.name !== "string") throw new Error("Parameter 'name' is required.");
  if (!a.type || typeof a.type !== "string") throw new Error("Parameter 'type' is required.");
  return auroraRequest(creds, "/dashboard/providers", { method: "POST", body: a });
}

export async function runUpdateProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  const { id, ...body } = a;
  return auroraRequest(creds, `/dashboard/providers/${id}`, { method: "PUT", body });
}

export async function runDeleteProvider(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, `/dashboard/providers/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
