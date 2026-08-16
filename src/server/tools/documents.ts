import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const LIST_DOCUMENTS_TOOL = {
  name: "list_documents",
  title: "List documents for an AI",
  description:
    "Returns the uploaded RAG documents for a given AI.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      purpose: {
        type: "string",
        enum: ["rag", "prompt"],
        description: "Filter by document purpose.",
      },
    },
    required: ["aiId"],
    additionalProperties: false,
  },
} as const;

export const GET_DOCUMENT_TOOL = {
  name: "get_document",
  title: "Get document details",
  description: "Returns details of a specific document in an AI's knowledge base.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The document's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export const DELETE_DOCUMENT_TOOL = {
  name: "delete_document",
  title: "Delete a document",
  description: "Removes an uploaded document from an AI's knowledge base.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The document's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export async function runListDocuments(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  const qs =
    a.purpose && typeof a.purpose === "string"
      ? `?purpose=${encodeURIComponent(a.purpose)}`
      : "";
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/documents` + qs);
}

export async function runGetDocument(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/documents/${a.id}`);
}

export async function runDeleteDocument(
  creds: Credentials,
  args: unknown,
): Promise<{ deleted: true }> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  await auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/documents/${a.id}`, { method: "DELETE" });
  return { deleted: true };
}
