import { createHmac } from "node:crypto";
import { PACKAGE_NAME } from "../config.js";
import { type Credentials, saveCredentials } from "./credentials.js";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [chave: string]: JsonValue | undefined };

/**
 * Como a requisição se identifica:
 * - `servico`  → `x-aurora-secret` (webhooks de escrita da IA)
 * - `usuario`  → `Authorization: Bearer <JWT>` (rotas do painel)
 * - `publico`  → sem credencial; manda o Bearer se existir, porque algumas
 *   rotas públicas enriquecem a resposta para quem está logado.
 */
export type AuthMode = "servico" | "usuario" | "publico";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  auth: AuthMode;
  query?: Record<string, string | number | undefined>;
  body?: Record<string, JsonValue | undefined>;
}

/**
 * Erro já traduzido para o que a IA precisa fazer a seguir. `status` 0 é falha
 * de rede — não houve resposta HTTP.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Falta credencial: a IA não consegue resolver sozinha, o dono da máquina resolve. */
export class CredentialMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialMissingError";
  }
}

export function requireServiceSecret(creds: Credentials): string {
  if (!creds.serviceSecret) {
    throw new CredentialMissingError(
      "Nenhum segredo de serviço configurado. Rode `npx " +
        PACKAGE_NAME +
        " login-servico` na máquina que hospeda este MCP, ou defina a env FUNILARIA_SERVICE_SECRET " +
        "(mesmo valor de AURORA_WEBHOOK_SECRET no backend). Não é possível escrever no portal sem isso.",
    );
  }
  return creds.serviceSecret;
}

export function requireToken(creds: Credentials): string {
  if (!creds.token) {
    throw new CredentialMissingError(
      "Nenhuma sessão de usuário salva. Rode `npx " +
        PACKAGE_NAME +
        " login` para autenticar com um usuário que tenha oficina, ou defina a env FUNILARIA_TOKEN.",
    );
  }
  return creds.token;
}

function joinUrl(base: string, caminho: string): string {
  const semBarra = base.replace(/\/+$/, "");
  const comBarra = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${semBarra}${comBarra}`;
}

function buildUrl(creds: Credentials, caminho: string, query?: RequestOptions["query"]): string {
  const url = joinUrl(creds.apiUrl, caminho);
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(chave, String(valor));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Campos `undefined` viram ausência, não `null`: o ValidationPipe recusa nulo. */
function serializeBody(body: Record<string, JsonValue | undefined>): string {
  const limpo: Record<string, JsonValue> = {};
  for (const [chave, valor] of Object.entries(body)) {
    if (valor !== undefined) limpo[chave] = valor;
  }
  return JSON.stringify(limpo);
}

/**
 * Assinatura HMAC do corpo, prevista na ADR-001 como sucessora do segredo
 * estático. Vai junto do `x-aurora-secret` — o backend ainda não verifica, e
 * header desconhecido é ignorado, então dá para ligar o lado do servidor sem
 * quebrar quem já está rodando. O timestamp entra no que é assinado para que a
 * verificação futura possa recusar replay.
 */
function signatureHeaders(segredo: string, payload: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const assinatura = createHmac("sha256", segredo)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return { "x-timestamp": timestamp, "x-signature": `sha256=${assinatura}` };
}

/** Mensagem que o Nest devolveu; `message` pode ser string ou array (class-validator). */
function backendMessage(parsed: unknown): string | null {
  if (typeof parsed === "string" && parsed.trim().length > 0) return parsed.trim();
  if (parsed && typeof parsed === "object") {
    const message = (parsed as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
    if (Array.isArray(message)) {
      const partes = message.filter((m): m is string => typeof m === "string");
      if (partes.length > 0) return partes.join("; ");
    }
  }
  return null;
}

/**
 * Traduz o HTTP para uma instrução acionável. A IA que consome as tools não vê
 * o backend: se a mensagem não disser o que corrigir, ela tenta de novo igual.
 */
function errorFromResponse(
  status: number,
  parsed: unknown,
  auth: AuthMode,
  caminho: string,
): ApiError {
  const detalhe = backendMessage(parsed);
  const sufixo = detalhe ? ` Backend: ${detalhe}` : "";

  if (status === 400) {
    return new ApiError(
      `O backend recusou os dados enviados para ${caminho} (400).${sufixo} ` +
        "Corrija os campos citados e chame a tool de novo — repetir igual vai falhar igual.",
      status,
      parsed,
    );
  }
  if (status === 401) {
    if (auth === "servico") {
      return new ApiError(
        `Credencial de serviço recusada em ${caminho} (401).${sufixo} ` +
          "O segredo salvo não bate com AURORA_WEBHOOK_SECRET do backend, ou a rota exige JWT de usuário. " +
          "Isso é configuração da máquina: avise o responsável, não tente outra tool.",
        status,
        parsed,
      );
    }
    return new ApiError(
      `Sessão expirada ou inválida em ${caminho} (401).${sufixo} ` +
        `Rode \`npx ${PACKAGE_NAME} login\` para autenticar de novo.`,
      status,
      parsed,
    );
  }
  if (status === 403) {
    return new ApiError(
      `Sem permissão para ${caminho} (403).${sufixo} ` +
        "O usuário autenticado não tem o papel exigido por esta rota.",
      status,
      parsed,
    );
  }
  if (status === 404) {
    return new ApiError(
      `Recurso não encontrado em ${caminho} (404).${sufixo} ` +
        "Confira os ids enviados; não invente outro valor para tentar de novo.",
      status,
      parsed,
    );
  }
  if (status === 429) {
    return new ApiError(
      `Limite de requisições atingido em ${caminho} (429).${sufixo} Espere antes de repetir.`,
      status,
      parsed,
    );
  }
  if (status >= 500) {
    return new ApiError(
      `A API falhou ao processar ${caminho} (${status}).${sufixo} ` +
        "É erro do servidor, não do payload: relate ao responsável em vez de reenviar variações.",
      status,
      parsed,
    );
  }
  return new ApiError(`Erro ${status} em ${caminho}.${sufixo}`, status, parsed);
}

async function parseBody(res: Response): Promise<unknown> {
  const texto = await res.text();
  if (texto.length === 0) return null;
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return texto;
  }
}

interface SessionResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: { email?: string; shopId?: string | null };
}

/**
 * O access token vive ~15 minutos e o servidor MCP fica ligado por horas — sem
 * renovar, toda tool de leitura morreria em 401 no meio da sessão. A rotação do
 * refresh obriga a gravar o novo par em disco na hora.
 */
async function tryRefresh(creds: Credentials): Promise<string | null> {
  if (!creds.refreshToken) return null;
  let res: Response;
  try {
    res = await fetch(joinUrl(creds.apiUrl, "/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: creds.refreshToken }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await parseBody(res)) as SessionResponse | null;
  if (!data?.accessToken) return null;

  creds.token = data.accessToken;
  creds.refreshToken = data.refreshToken ?? creds.refreshToken;
  if (data.user?.shopId !== undefined) creds.shopId = data.user.shopId ?? creds.shopId;
  await saveCredentials({
    token: creds.token,
    refreshToken: creds.refreshToken,
    shopId: creds.shopId,
  });
  return creds.token;
}

async function send(
  creds: Credentials,
  caminho: string,
  opts: RequestOptions,
  bearer: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const payload = opts.body === undefined ? undefined : serializeBody(opts.body);

  if (payload !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth === "servico") {
    const segredo = requireServiceSecret(creds);
    headers["x-aurora-secret"] = segredo;
    // A oficina deste servidor MCP, quando ele foi registrado no escopo de uma
    // (FUNILARIA_SHOP_ID no env). O backend confia NESTE header e ignora
    // `shopId` vindo como argumento da tool: o valor sai do processo, não da
    // conversa, então nenhuma instrução na mensagem alcança outra oficina.
    if (creds.shopId) headers["x-funilaria-shop"] = creds.shopId;
    if (creds.signingSecret && payload !== undefined) {
      Object.assign(headers, signatureHeaders(creds.signingSecret, payload));
    }
  } else if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  try {
    return await fetch(buildUrl(creds, caminho, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body: payload,
    });
  } catch (err) {
    throw new ApiError(
      `Não consegui falar com a API em ${creds.apiUrl} (${
        err instanceof Error ? err.message : String(err)
      }). Confirme se o backend está no ar e se a URL configurada está certa.`,
      0,
    );
  }
}

export async function apiRequest<T>(
  creds: Credentials,
  caminho: string,
  opts: RequestOptions,
): Promise<T> {
  let bearer: string | null = null;
  if (opts.auth === "usuario") bearer = requireToken(creds);
  else if (opts.auth === "publico") bearer = creds.token;

  let res = await send(creds, caminho, opts, bearer);

  // Uma única tentativa de renovar: se o refresh também falhar, o 401 original
  // é o que a IA precisa ver.
  if (res.status === 401 && opts.auth !== "servico" && creds.refreshToken) {
    const novo = await tryRefresh(creds);
    if (novo) res = await send(creds, caminho, opts, novo);
  }

  const parsed = await parseBody(res);
  if (!res.ok) throw errorFromResponse(res.status, parsed, opts.auth, caminho);
  return parsed as T;
}
