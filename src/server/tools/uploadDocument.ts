import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const UPLOAD_DOCUMENT_TOOL = {
  name: "upload_document",
  title: "Upload a RAG document",
  description:
    "Uploads a text document to an AI's knowledge base for RAG (Retrieval-Augmented Generation). " +
    "The document will be chunked, embedded, and made searchable during conversations. " +
    "Accepts the document content as a string with a filename and optional purpose.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      filename: {
        type: "string",
        description: "Name of the document (e.g. 'manual-produto.txt', 'faq.md').",
      },
      content: {
        type: "string",
        description: "The full text content of the document.",
      },
      purpose: {
        type: "string",
        enum: ["prompt", "rag"],
        description: "Purpose: 'rag' for knowledge base (default), 'prompt' for system prompt attachment.",
      },
    },
    required: ["aiId", "filename", "content"],
    additionalProperties: false,
  },
} as const;

export async function runUploadDocument(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string")
    throw new Error("Parameter 'aiId' is required.");
  if (!a.filename || typeof a.filename !== "string")
    throw new Error("Parameter 'filename' is required.");
  if (!a.content || typeof a.content !== "string")
    throw new Error("Parameter 'content' is required.");

  const blob = new Blob([a.content], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", blob, a.filename);
  if (a.purpose && typeof a.purpose === "string") {
    formData.append("purpose", a.purpose);
  }

  const url = `${creds.auroraUrl.replace(/\/+$/, "")}/dashboard/ia/${a.aiId}/documents`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
    },
    body: formData,
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const message = (parsed as any)?.message ?? `HTTP ${res.status}`;
    throw new Error(`Upload failed (${res.status}): ${message}`);
  }

  return parsed;
}
