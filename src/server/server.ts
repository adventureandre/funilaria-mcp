import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ENV_VARS, SERVER_NAME, SERVER_VERSION } from "../config.js";
import {
  describeCredentials,
  loadCredentials,
  type Credentials,
} from "../auth/credentials.js";
import { ApiError, CredentialMissingError } from "../auth/client.js";
import { ArgumentoInvalidoError } from "./types.js";
import {
  CATALOGO_INDISPONIVEL_TOOL,
  callCatalogTool,
  fetchCatalog,
} from "./catalog/remoteCatalog.js";

/**
 * Formato de `CallToolResult` do SDK. A assinatura de índice está aqui porque
 * o tipo do SDK aceita campos extras (`_meta`, `task`); sem ela o handler não
 * casa com o schema.
 */
interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: true;
  [chave: string]: unknown;
}

function jsonContent(payload: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

/**
 * O que chega na IA é a frase, não a exceção: stack trace não diz o que fazer
 * a seguir, e é a IA que decide se corrige o payload, avisa o humano ou desiste.
 */
function errorContent(err: unknown): ToolResult {
  let texto: string;
  if (
    err instanceof ArgumentoInvalidoError ||
    err instanceof CredentialMissingError ||
    err instanceof ApiError
  ) {
    texto = err.message;
  } else if (err instanceof Error) {
    texto = `Falha inesperada no funilaria-mcp: ${err.message}`;
  } else {
    texto = `Falha inesperada no funilaria-mcp: ${String(err)}`;
  }
  return { content: [{ type: "text", text: texto }], isError: true };
}

/**
 * stdout é o canal do protocolo MCP — qualquer byte solto ali quebra a sessão.
 * Diagnóstico vai por stderr, que é o que o runtime do Aurora recolhe no log
 * do servidor.
 */
async function logConfiguracao(): Promise<void> {
  const resumo = describeCredentials(await loadCredentials());
  process.stderr.write(`[${SERVER_NAME}] ${resumo.linhas.join(" · ")}\n`);
  if (!resumo.temServico) {
    process.stderr.write(
      `[${SERVER_NAME}] Sem credencial de serviço: as tools de escrita vão recusar toda chamada. ` +
        `Defina ${ENV_VARS.serviceSecret[0]} no ambiente deste processo.\n`,
    );
  }
}

export async function startServer(): Promise<void> {
  // Antes de conectar: se a env estiver com o nome errado, o operador vê no
  // primeiro segundo, e não no primeiro 401 de madrugada.
  await logConfiguracao();

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } },
  );

  // O catálogo é buscado UMA vez, na subida: o cliente MCP lê tools/list logo
  // após conectar e não volta a perguntar. Tool adicionada no backend entra na
  // próxima reinstalação do servidor no Aurora.
  const catalogo = await fetchCatalog(await loadCredentials());
  const tools = catalogo.ok ? catalogo.tools : [CATALOGO_INDISPONIVEL_TOOL];
  const disponiveis = new Set(tools.map((t) => t.name));

  process.stderr.write(
    catalogo.ok
      ? `[${SERVER_NAME}] ${tools.length} tools carregadas do catálogo.\n`
      : `[${SERVER_NAME}] catálogo indisponível — nenhuma tool do portal nesta sessão.\n`,
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === CATALOGO_INDISPONIVEL_TOOL.name) {
      return errorContent(new Error(CATALOGO_INDISPONIVEL_TOOL.description));
    }
    if (!disponiveis.has(name)) {
      return errorContent(
        new Error(
          `Tool desconhecida: ${name}. Disponíveis: ${[...disponiveis].join(", ")}.`,
        ),
      );
    }

    try {
      // A credencial é lida a cada chamada: quem trocar o segredo com o
      // servidor no ar passa a valer na próxima tool, sem reiniciar o cliente.
      const creds = await loadCredentials();
      return jsonContent(await callCatalogTool(creds, name, args));
    } catch (err) {
      return errorContent(err);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
