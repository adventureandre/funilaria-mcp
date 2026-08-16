import { auroraRequest, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

// Documentos gerados pela IA (outbound). Backend: /dashboard/generated-docs.
// `download` devolve bytes binários; `url` devolve uma signed URL.

export const DOWNLOAD_GENERATED_DOC_TOOL = {
  name: "download_generated_doc",
  title: "Download generated document",
  description:
    "Downloads the document bytes. Returns `{ contentType, base64 }` (file content base64-encoded). " +
    "For a shareable link prefer get_generated_doc_url.",
  inputSchema: {
    type: "object" as const,
    properties: { id: { type: "string", description: "The document's ID." } },
    required: ["id"],
    additionalProperties: false,
  },
} as const;

function requireId(args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  return a.id;
}

export async function runDownloadGeneratedDoc(creds: Credentials, args: unknown): Promise<unknown> {
  return auroraRequest(creds, apiPath`/dashboard/generated-docs/${requireId(args)}/download`, {
    responseType: "binary",
  });
}

