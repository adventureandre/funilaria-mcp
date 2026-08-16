import { auroraRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";

/**
 * Descoberta dinâmica de tools servidas pelo backend.
 *
 * Antes, cada tool vivia escrita à mão neste pacote — 40 arquivos e ~4k linhas —
 * então qualquer rota nova no Aurora exigia editar aqui, publicar no npm e
 * esperar todo mundo atualizar. Com o catálogo, o backend publica nome,
 * descrição e schema; este cliente registra em runtime e despacha a execução
 * de volta pelo nome.
 *
 * O caminho HTTP de cada tool NUNCA chega aqui: quem resolve a rota é o
 * backend, então este processo não consegue ser usado como proxy genérico da
 * API.
 */

export interface RemoteTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  group: string;
}

interface CatalogResponse {
  version: number;
  tools: RemoteTool[];
}

/**
 * Busca o catálogo. Falha nunca derruba o servidor, mas o resultado distingue
 * "não consegui falar com o catálogo" de "o catálogo veio vazio": a maior parte
 * das tools vive no backend, então cair no silêncio deixaria o usuário com uma
 * lista curta e nenhuma pista do motivo.
 */
export async function fetchRemoteTools(
  creds: Credentials,
): Promise<{ ok: boolean; tools: RemoteTool[] }> {
  try {
    const res = await auroraRequest<CatalogResponse>(creds, "/dashboard/mcp-catalog");
    return { ok: true, tools: Array.isArray(res?.tools) ? res.tools : [] };
  } catch (err) {
    process.stderr.write(
      `[aurora-mcp] catálogo indisponível em ${creds.auroraUrl}: ${
        err instanceof Error ? err.message : String(err)
      }\n`,
    );
    return { ok: false, tools: [] };
  }
}

/**
 * Aparece na lista do editor SÓ quando o catálogo falhou. Sem ela, o sintoma
 * seria "sumiram as tools" — com ela, o motivo está escrito onde o usuário olha.
 */
export const CATALOG_UNAVAILABLE_TOOL = {
  name: "aurora_catalog_unavailable",
  title: "Aurora catalog unavailable",
  description:
    "The Aurora backend did not answer GET /dashboard/mcp-catalog, so most tools are missing from this session. " +
    "Check that you are logged in (npx @expertcustom/aurora-mcp login) and that the backend is up to date — " +
    "the catalog requires a recent Aurora. Pin aurora-mcp@0.6.x to keep the old bundled tools.",
  inputSchema: { type: "object" as const, properties: {}, additionalProperties: false },
} as const;

/** Executa uma tool do catálogo — o backend resolve qual rota ela representa. */
export async function callRemoteTool(
  creds: Credentials,
  name: string,
  args: unknown,
): Promise<unknown> {
  return auroraRequest(creds, "/dashboard/mcp-catalog/execute", {
    method: "POST",
    body: { name, args: args ?? {} },
  });
}

/**
 * Junta as tools do catálogo com as que ainda vivem neste pacote.
 *
 * O catálogo VENCE em caso de nome repetido: é assim que uma tool migra para o
 * backend sem exigir publish — a definição de lá passa a valer na hora, e a
 * limpeza do código local vira faxina sem pressa.
 */
export function mergeTools<T extends { name: string }>(
  locais: T[],
  remotas: RemoteTool[],
): { tools: Array<T | RemoteTool>; remoteNames: Set<string> } {
  const remoteNames = new Set(remotas.map((t) => t.name));
  const preservadas = locais.filter((t) => !remoteNames.has(t.name));
  return { tools: [...preservadas, ...remotas], remoteNames };
}
