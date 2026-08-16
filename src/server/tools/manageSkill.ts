import { auroraRequest, auroraUpload, apiPath } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

export const IMPORT_SKILL_TOOL = {
  name: "import_skill",
  title: "Import a skill",
  description:
    "Imports a skill into an AI from an exported ZIP (as produced by export_skill). " +
    "Pass the ZIP bytes as base64.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      zipBase64: { type: "string", description: "The skill ZIP file content, base64-encoded." },
      filename: { type: "string", description: "Filename for the upload (default 'skill.zip')." },
    },
    required: ["aiId", "zipBase64"],
    additionalProperties: false,
  },
} as const;

export const EXPORT_SKILL_TOOL = {
  name: "export_skill",
  title: "Export a skill",
  description:
    "Exports a skill as a portable ZIP. Returns `{ contentType, base64 }` — the ZIP bytes are base64-encoded.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      id: { type: "string", description: "The skill's ID." },
    },
    required: ["aiId", "id"],
    additionalProperties: false,
  },
} as const;

export async function runImportSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.zipBase64 || typeof a.zipBase64 !== "string")
    throw new Error("Parameter 'zipBase64' is required.");

  const filename =
    a.filename && typeof a.filename === "string" ? a.filename : "skill.zip";
  const bytes = Buffer.from(a.zipBase64, "base64");
  const blob = new Blob([bytes], { type: "application/zip" });
  const formData = new FormData();
  formData.append("file", blob, filename);

  return auroraUpload(creds, apiPath`/dashboard/ia/${a.aiId}/skills/import`, formData);
}

export async function runExportSkill(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string") throw new Error("Parameter 'aiId' is required.");
  if (!a.id || typeof a.id !== "string") throw new Error("Parameter 'id' is required.");
  // Resposta é um ZIP binário — não passar por JSON.parse.
  return auroraRequest(creds, apiPath`/dashboard/ia/${a.aiId}/skills/${a.id}/export`, {
    responseType: "binary",
  });
}

