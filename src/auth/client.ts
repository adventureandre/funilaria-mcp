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
}

export async function auroraRequest<T>(
  creds: Pick<Credentials, "auroraUrl" | "token">,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = joinUrl(creds.auroraUrl, path);
  const headers: Record<string, string> = {
    Accept: "application/json",
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

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new AuroraApiError(
        "Token expired or invalid. Run `npx @expertcustom/aurora-mcp login` to re-authenticate.",
        401,
        parsed,
      );
    }
    const message =
      (parsed as any)?.message ??
      (typeof parsed === "string" ? parsed : `HTTP ${res.status}`);
    throw new AuroraApiError(message, res.status, parsed);
  }

  return parsed as T;
}
