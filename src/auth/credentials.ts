import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { CONFIG_DIR_NAME, DEFAULT_API_URL, ENV_VARS, envValue } from "../config.js";

/**
 * O MCP carrega DUAS identidades porque o backend tem duas portas com
 * autenticações diferentes (veja README, seção "Autenticação"):
 *
 * - `serviceSecret` — segredo compartilhado dos webhooks de escrita da IA
 *   (`x-aurora-secret`). Não representa pessoa nenhuma; identifica o serviço.
 * - `token` — JWT de um usuário humano, único jeito hoje de ler `GET /estoque`.
 *
 * O desenho-alvo é a credencial de serviço cobrir também as leituras, com o
 * `shopId` explícito no parâmetro da tool. Enquanto o backend não aceita isso,
 * as duas convivem.
 */
export interface Credentials {
  apiUrl: string;
  serviceSecret: string | null;
  /** Segredo da assinatura HMAC do corpo (`x-signature`). Opcional. */
  signingSecret: string | null;
  token: string | null;
  refreshToken: string | null;
  email: string | null;
  /** Oficina padrão das tools que precisam de escopo. */
  shopId: string | null;
  savedAt: string;
}

/** O que o arquivo em disco guarda — tudo opcional, ele nasce incompleto. */
type StoredCredentials = Partial<Omit<Credentials, "apiUrl">> & { apiUrl?: string };

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), ".config");
  return path.join(base, CONFIG_DIR_NAME);
}

function credentialsPath(): string {
  return path.join(configDir(), "credentials.json");
}

export function credentialsLocation(): string {
  return credentialsPath();
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

function env(nomes: readonly string[]): string | null {
  return envValue(nomes)?.valor ?? null;
}

async function readFileCredentials(): Promise<StoredCredentials> {
  try {
    const raw = await fs.readFile(credentialsPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredCredentials) : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

/**
 * Credencial efetiva = arquivo + env, com a env por cima. É sempre devolvida
 * (nunca `null`): saber SE dá para chamar cada rota é decisão de quem chama,
 * via `requireServiceSecret`/`requireToken`, que explicam o que falta fazer.
 */
export async function loadCredentials(): Promise<Credentials> {
  const file = await readFileCredentials();
  return {
    apiUrl: (env(ENV_VARS.apiUrl) ?? texto(file.apiUrl) ?? DEFAULT_API_URL).replace(
      /\/+$/,
      "",
    ),
    serviceSecret: env(ENV_VARS.serviceSecret) ?? texto(file.serviceSecret),
    signingSecret: env(ENV_VARS.signingSecret) ?? texto(file.signingSecret),
    token: env(ENV_VARS.token) ?? texto(file.token),
    refreshToken: texto(file.refreshToken),
    email: texto(file.email),
    shopId: env(ENV_VARS.shopId) ?? texto(file.shopId),
    savedAt: texto(file.savedAt) ?? new Date().toISOString(),
  };
}

export interface ConfigSummary {
  linhas: string[];
  temServico: boolean;
  temUsuario: boolean;
}

/**
 * Diagnóstico compartilhado pelo comando `status` e pelo log de inicialização.
 * Quando o Aurora sobe este processo, ninguém vai rodar `status` no terminal —
 * se o nome da env estiver errado, o único sintoma seria um 401 na primeira
 * tool, horas depois. Por isso a origem de cada credencial vira log de boot.
 *
 * Valor de segredo nunca aparece: só se existe e de qual env veio.
 */
export function describeCredentials(creds: Credentials): ConfigSummary {
  const origem = (nomes: readonly string[]): string =>
    envValue(nomes)?.nome ?? "arquivo de credenciais";

  return {
    temServico: creds.serviceSecret !== null,
    temUsuario: creds.token !== null,
    linhas: [
      `API: ${creds.apiUrl} (${origem(ENV_VARS.apiUrl)})`,
      `Credencial de serviço: ${
        creds.serviceSecret ? `configurada via ${origem(ENV_VARS.serviceSecret)}` : "AUSENTE"
      }`,
      `Assinatura HMAC: ${
        creds.signingSecret ? `configurada via ${origem(ENV_VARS.signingSecret)}` : "não configurada"
      }`,
      `Sessão de usuário: ${
        creds.token
          ? `${creds.email ?? "sem e-mail registrado"} (${origem(ENV_VARS.token)})`
          : "AUSENTE"
      }`,
      `Oficina padrão: ${
        creds.shopId ? `${creds.shopId} (${origem(ENV_VARS.shopId)})` : "não definida"
      }`,
    ],
  };
}

/**
 * Grava só os campos informados, preservando o resto do arquivo: o login de
 * serviço e o login humano são comandos separados e não podem se apagar.
 */
export async function saveCredentials(patch: StoredCredentials): Promise<string> {
  const dir = configDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const atual = await readFileCredentials();
  const proximo: StoredCredentials = {
    ...atual,
    ...patch,
    savedAt: new Date().toISOString(),
  };
  const file = credentialsPath();
  await fs.writeFile(file, JSON.stringify(proximo, null, 2), { mode: 0o600 });
  return file;
}

export async function clearCredentials(): Promise<void> {
  try {
    await fs.unlink(credentialsPath());
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
