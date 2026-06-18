import type { Credentials } from "./credentials";

export function apiPath(
  strings: TemplateStringsArray,
  ...values: (string | number)[]
): string {
  return strings.reduce(
    (result, str, i) =>
      result + str + (i < values.length ? encodeURIComponent(String(values[i])) : ""),
    "",
  );
}

export class AuroraApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "AuroraApiError";
  }
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super(
      "No Aurora credentials found. Run `npx @expertcustom/aurora-mcp login` first.",
    );
    this.name = "AuthenticationRequiredError";
  }
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * "binary" para endpoints que devolvem bytes (ex.: export de skill em ZIP).
   * O corpo é retornado como `{ contentType, base64 }` em vez de JSON parseado.
   */
  responseType?: "json" | "binary";
}

/** Conteúdo binário de uma resposta, em base64 (não passa por JSON.parse). */
export interface BinaryResponse {
  contentType: string | null;
  base64: string;
}

/** Erro padrão a partir de uma resposta !ok, reaproveitando o parse de texto. */
function errorFromResponse(status: number, parsed: unknown): AuroraApiError {
  if (status === 401) {
    return new AuroraApiError(
      "Token expired or invalid. Run `npx @expertcustom/aurora-mcp login` to re-authenticate.",
      401,
      parsed,
    );
  }
  const message =
    (parsed as any)?.message ??
    (typeof parsed === "string" ? parsed : `HTTP ${status}`);
  return new AuroraApiError(message, status, parsed);
}

async function parseTextBody(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text.length > 0 ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function auroraRequest<T>(
  creds: Pick<Credentials, "auroraUrl" | "token">,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = joinUrl(creds.auroraUrl, path);
  const binary = opts.responseType === "binary";
  const headers: Record<string, string> = {
    Accept: binary ? "*/*" : "application/json",
    Authorization: `Bearer ${creds.token}`,
    ...(opts.headers ?? {}),
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  // Erros sempre vêm como JSON/texto, mesmo em rotas binárias.
  if (!res.ok) {
    throw errorFromResponse(res.status, await parseTextBody(res));
  }

  if (binary) {
    const buf = Buffer.from(await res.arrayBuffer());
    const result: BinaryResponse = {
      contentType: res.headers.get("content-type"),
      base64: buf.toString("base64"),
    };
    return result as T;
  }

  return (await parseTextBody(res)) as T;
}

/**
 * POST multipart/form-data com a credencial Bearer. Helper compartilhado pelas
 * tools de upload (skill file, documento) e import (ZIP), para padronizar o
 * tratamento de erro (AuroraApiError) em vez de repetir fetch cru em cada tool.
 */
export async function auroraUpload<T>(
  creds: Pick<Credentials, "auroraUrl" | "token">,
  path: string,
  formData: FormData,
): Promise<T> {
  const url = joinUrl(creds.auroraUrl, path);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${creds.token}` },
    body: formData,
  });

  const parsed = await parseTextBody(res);
  if (!res.ok) {
    throw errorFromResponse(res.status, parsed);
  }
  return parsed as T;
}
