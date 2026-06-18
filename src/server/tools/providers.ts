import { auroraRequest, apiPath } from "../../auth/client.js";
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

// MessagingProvider é o canal de mensageria (gateway WhatsApp/HTTP). Modelo
// plano no backend — sem objeto `config`. `apiKey` é o token de auth do gateway.
const MESSAGING_PROVIDER_FIELDS = {
  displayName: { type: "string", description: "Human-friendly label." },
  baseUrl: { type: "string", description: "Gateway base URL." },
  apiKey: { type: "string", description: "Auth token/API key for the gateway." },
  session: { type: "string", description: "Session name (default 'default')." },
  authHeader: { type: "string", description: "Custom auth header name, if any." },
  endpointSendText: { type: "string", description: "Path/URL to send text messages." },
  endpointSendImage: { type: "string", description: "Path/URL to send images." },
  endpointSendFile: { type: "string", description: "Path/URL to send files." },
  endpointStatus: { type: "string", description: "Path/URL for connection status." },
  endpointStart: { type: "string", description: "Path/URL to start/connect the session." },
  endpointStop: { type: "string", description: "Path/URL to stop/disconnect the session." },
  bodyTemplateSendText: { type: "string", description: "Request body template for text." },
  bodyTemplateSendMedia: { type: "string", description: "Request body template for media." },
} as const;

export const CREATE_PROVIDER_TOOL = {
  name: "create_provider",
  title: "Create a messaging provider",
  description:
    "Registers a new messaging provider (WhatsApp/HTTP gateway). " +
    "`apiKey` is the gateway auth token.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Provider name/slug." },
      type: { type: "string", description: "Messaging channel type/driver." },
      ...MESSAGING_PROVIDER_FIELDS,
      ownerId: { type: "string", description: "Owner (master only)." },
    },
    required: ["name", "displayName", "type", "baseUrl"],
    additionalProperties: false,
  },
} as const;

export const UPDATE_PROVIDER_TOOL = {
  name: "update_provider",
  title: "Update a messaging provider",
  description:
    "Updates an existing messaging provider. Pass only the fields to change. " +
    "Re-sending the masked `apiKey` from get_provider leaves the stored key untouched.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The provider's ID." },
      type: { type: "string" },
      isActive: { type: "boolean" },
      ...MESSAGING_PROVIDER_FIELDS,
      ownerId: { type: "string", description: "Owner (master only)." },
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
  return auroraRequest(creds, apiPath`/dashboard/providers/${a.id}/test`);
}

export async function runGetProvider(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/providers/${a.id}`);
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
  return auroraRequest(creds, apiPath`/dashboard/providers/${id}`, { method: "PUT", body });
}

export async function runDeleteProvider(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/providers/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
