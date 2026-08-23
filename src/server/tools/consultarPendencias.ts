import { apiRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import { objeto, textoObrigatorio, type ToolDefinition } from "./args.js";

interface ConsultaAberta {
  candidateId: string;
  peca: string;
  veiculo: string | null;
  oficina: string;
  perguntadoEm: string | null;
}

interface PedidoAberto {
  requestId: string;
  oficina: string;
  itens: string[];
  enviadoEm: string | null;
}

interface PendenciasResponse {
  fornecedor: { id: string; nome: string; conviteStatus: string } | null;
  consultas: ConsultaAberta[];
  pedidos: PedidoAberto[];
}

export const CONSULTAR_PENDENCIAS_TOOL: ToolDefinition = {
  name: "consultar_pendencias_fornecedor",
  title: "Ver o que está em aberto com um fornecedor",
  description:
    "Dado o número de WhatsApp de um fornecedor, devolve o que o portal está esperando dele: " +
    "`consultas` (perguntas de peça já enviadas e sem resposta, cada uma com o `candidateId`) e " +
    "`pedidos` (pedidos de material enviados e não confirmados). Somente leitura. " +
    "USE SEMPRE que um fornecedor te mandar mensagem no WhatsApp — é assim que você descobre a qual " +
    "peça ou pedido a resposta dele se refere, porque a mensagem dele chega só com o telefone, sem o " +
    "id da consulta. O `candidateId` que volta aqui é o que você passa depois em responder_busca_peca. " +
    "Se `consultas` e `pedidos` vierem vazios, o fornecedor escreveu por conta própria: não invente " +
    "um id, responda como conversa normal. Se `fornecedor` vier null, o número não está cadastrado.",
  inputSchema: {
    type: "object",
    properties: {
      whatsapp: {
        type: "string",
        description:
          "Telefone do fornecedor, só dígitos, como veio do WhatsApp (ex.: '5511987654321'). " +
          "O casamento é pelos 8 últimos dígitos, então DDI e o nono dígito não atrapalham.",
      },
    },
    required: ["whatsapp"],
    additionalProperties: false,
  },
};

export async function runConsultarPendencias(
  creds: Credentials,
  args: unknown,
): Promise<PendenciasResponse> {
  const a = objeto(args);
  const whatsapp = textoObrigatorio(a, "whatsapp").replace(/\D/g, "");
  return apiRequest<PendenciasResponse>(creds, "/fornecedores/pendencias", {
    auth: "servico",
    query: { whatsapp },
  });
}
