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
import { ArgumentoInvalidoError, type ToolDefinition } from "./tools/args.js";
import { PUBLICAR_NOTICIA_TOOL, runPublicarNoticia } from "./tools/publicarNoticia.js";
import {
  RESPONDER_BUSCA_PECA_TOOL,
  runResponderBuscaPeca,
} from "./tools/responderBuscaPeca.js";
import { LANCAR_CONSUMO_TOOL, runLancarConsumo } from "./tools/lancarConsumo.js";
import { CONSULTAR_ESTOQUE_TOOL, runConsultarEstoque } from "./tools/consultarEstoque.js";
import {
  CONSULTAR_BALANCETE_TOOL,
  runConsultarBalancete,
} from "./tools/consultarBalancete.js";
import { BUSCAR_FORNECEDOR_TOOL, runBuscarFornecedor } from "./tools/buscarFornecedor.js";
import {
  CONSULTAR_PENDENCIAS_TOOL,
  runConsultarPendencias,
} from "./tools/consultarPendencias.js";
import {
  RESPONDER_CONVITE_FORNECEDOR_TOOL,
  runResponderConviteFornecedor,
} from "./tools/responderConviteFornecedor.js";

type ToolHandler = (creds: Credentials, args: unknown) => Promise<unknown>;

interface ToolRegistration {
  definition: ToolDefinition;
  handler: ToolHandler;
}

/**
 * Registro único: a lista publicada em `tools/list` e o despacho de
 * `tools/call` saem daqui, então não existe o bug de anunciar uma tool que
 * ninguém implementa (ou o contrário).
 */
const TOOLS: ToolRegistration[] = [
  { definition: PUBLICAR_NOTICIA_TOOL, handler: runPublicarNoticia },
  { definition: RESPONDER_BUSCA_PECA_TOOL, handler: runResponderBuscaPeca },
  { definition: LANCAR_CONSUMO_TOOL, handler: runLancarConsumo },
  { definition: CONSULTAR_ESTOQUE_TOOL, handler: runConsultarEstoque },
  { definition: CONSULTAR_BALANCETE_TOOL, handler: runConsultarBalancete },
  { definition: BUSCAR_FORNECEDOR_TOOL, handler: runBuscarFornecedor },
  { definition: CONSULTAR_PENDENCIAS_TOOL, handler: runConsultarPendencias },
  {
    definition: RESPONDER_CONVITE_FORNECEDOR_TOOL,
    handler: runResponderConviteFornecedor,
  },
];

const POR_NOME = new Map(TOOLS.map((t) => [t.definition.name, t]));

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

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: TOOLS.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = POR_NOME.get(name);
    if (!tool) {
      return errorContent(
        new Error(
          `Tool desconhecida: ${name}. Disponíveis: ${[...POR_NOME.keys()].join(", ")}.`,
        ),
      );
    }
    try {
      // A credencial é lida a cada chamada: quem rodar `login` com o servidor no
      // ar passa a valer na próxima tool, sem reiniciar o cliente MCP.
      const creds = await loadCredentials();
      return jsonContent(await tool.handler(creds, args));
    } catch (err) {
      return errorContent(err);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
