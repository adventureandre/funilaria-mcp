import type { Credentials } from "../../auth/credentials.js";

export const UPLOAD_SKILL_FILE_TOOL = {
  name: "upload_skill_file",
  title: "Upload a skill file",
  description:
    "Uploads a markdown file to a skill as a reference or example document. " +
    "The AI can read these files on-demand during skill execution via skill_read_file.",
  inputSchema: {
    type: "object" as const,
    properties: {
      aiId: { type: "string", description: "The AI's ID." },
      skillId: { type: "string", description: "The skill's ID." },
      filename: {
        type: "string",
        description: "Filename ending with .md (e.g. 'template.md', 'example.md').",
      },
      content: {
        type: "string",
        description: "The markdown content of the file.",
      },
      fileType: {
        type: "string",
        enum: ["reference", "example"],
        description: "Type of file: 'reference' (default) or 'example'.",
      },
    },
    required: ["aiId", "skillId", "filename", "content"],
    additionalProperties: false,
  },
} as const;

export async function runUploadSkillFile(
  creds: Credentials,
  args: unknown,
): Promise<unknown> {
  const a = (args ?? {}) as Record<string, unknown>;
  if (!a.aiId || typeof a.aiId !== "string")
    throw new Error("Parameter 'aiId' is required.");
  if (!a.skillId || typeof a.skillId !== "string")
    throw new Error("Parameter 'skillId' is required.");
  if (!a.filename || typeof a.filename !== "string")
    throw new Error("Parameter 'filename' is required.");
  if (!a.content || typeof a.content !== "string")
    throw new Error("Parameter 'content' is required.");

  const blob = new Blob([a.content], { type: "text/markdown" });
  const formData = new FormData();
  formData.append("file", blob, a.filename);
  if (a.fileType && typeof a.fileType === "string") {
    formData.append("fileType", a.fileType);
  }

  const url = `${creds.auroraUrl.replace(/\/+$/, "")}/dashboard/ia/${a.aiId}/skills/${a.skillId}/files/upload`;
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
