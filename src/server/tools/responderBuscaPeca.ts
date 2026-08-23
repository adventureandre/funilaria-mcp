import { apiRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import { objeto, textoObrigatorio, textoOpcional, type ToolDefinition } from "./args.js";

/**
 * Resposta de `POST /buscas/webhook/resposta-fornecedor`.
 * `interpreted: false` significa que a mensagem ficou registrada mas a IA do
 * backend não conseguiu extrair os campos — o candidato fica REPLIED com o
 * texto cru para a oficina julgar.
 */
interface RespostaFornecedorResponse {
  interpreted: boolean;
  candidate?: Record<string, unknown>;
}

export const RESPONDER_BUSCA_PECA_TOOL: ToolDefinition = {
  name: "responder_busca_peca",
  title: "Registrar resposta do fornecedor a uma busca de peça",
  description:
    "Entrega ao portal a resposta que um fornecedor mandou no WhatsApp sobre uma busca de peça " +
    "(POST /buscas/webhook/resposta-fornecedor). Passe a mensagem do fornecedor COMO ELA VEIO, sem " +
    "resumir, traduzir ou interpretar: quem extrai preço, condição (original/paralela), prazo e se tem " +
    "ou não a peça é o backend. " +
    "Efeitos: grava a mensagem no log de auditoria do contato, atualiza o candidato da busca " +
    "(contactStatus=REPLIED), avisa a oficina em tempo real e, quando o fornecedor confirma que tem a " +
    "peça, cadastra a oferta no catálogo. Se a mensagem for uma saída do serviço (ex.: 'SAIR'), o " +
    "consentimento de contato do fornecedor é revogado. " +
    "Devolve { interpreted, candidate }: interpreted=false quer dizer que a resposta foi registrada mas " +
    "não pôde ser estruturada — não reenvie, a oficina vê o texto cru no painel. " +
    "Quando NÃO usar: para iniciar uma busca de peça (isso é a oficina quem faz no painel); para " +
    "mensagens de fornecedor que não sejam resposta a um contato registrado; e para lançar consumo de " +
    "material (use lancar_consumo).",
  inputSchema: {
    type: "object",
    properties: {
      candidateId: {
        type: "string",
        description:
          "Id do PartSearchCandidate que originou o contato — vem da mensagem enviada ao fornecedor. " +
          "Não invente nem reaproveite o id da busca (searchId): são coisas diferentes.",
      },
      message: {
        type: "string",
        maxLength: 4000,
        description: "Texto exato recebido do fornecedor, sem edição.",
      },
      externalId: {
        type: "string",
        description:
          "Id da mensagem no provedor de WhatsApp, quando houver. Serve para conciliar a auditoria.",
      },
    },
    required: ["candidateId", "message"],
    additionalProperties: false,
  },
};

export async function runResponderBuscaPeca(
  creds: Credentials,
  args: unknown,
): Promise<RespostaFornecedorResponse> {
  const a = objeto(args);
  return apiRequest<RespostaFornecedorResponse>(
    creds,
    "/buscas/webhook/resposta-fornecedor",
    {
      method: "POST",
      auth: "servico",
      body: {
        candidateId: textoObrigatorio(a, "candidateId"),
        message: textoObrigatorio(a, "message", { max: 4000 }),
        externalId: textoOpcional(a, "externalId"),
      },
    },
  );
}
