import { apiRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import { objeto, textoObrigatorio, type ToolDefinition } from "./args.js";

/**
 * Resposta de `GET /estoque/integracao/identificacao`.
 *
 * Campos nulos quando o número não pertence a nenhum funcionário ativo — ou
 * quando bate com mais de um, caso em que o backend prefere não adivinhar.
 */
interface IdentificacaoResponse {
  funcionario: { memberId: string; nome: string | null; papel: string } | null;
  oficina: { shopId: string; nome: string } | null;
}

export const IDENTIFICAR_FUNCIONARIO_TOOL: ToolDefinition = {
  name: "identificar_funcionario",
  title: "Descobrir de qual oficina é o número que mandou a mensagem",
  description:
    "Resolve um número de WhatsApp em funcionário e oficina " +
    "(GET /estoque/integracao/identificacao). Somente leitura. " +
    "É O PRIMEIRO PASSO de qualquer conversa de estoque: a mensagem chega identificada apenas pelo " +
    "telefone, e consultar_estoque e consultar_balancete exigem o shopId — que não se adivinha e não " +
    "se pergunta ao funcionário, porque ele não sabe. " +
    "Devolve { funcionario: { memberId, nome, papel }, oficina: { shopId, nome } }. Use o shopId nas " +
    "consultas e o memberId quando ele perguntar do consumo DELE ('quanto eu gastei esse mês?'), " +
    "passando-o em consultar_balancete. " +
    "Os dois campos vêm NULOS quando o número não é de nenhum funcionário ativo, ou quando bate com " +
    "mais de um cadastro — o backend não escolhe no palpite. Nesse caso não consulte estoque de " +
    "oficina nenhuma e não tente deduzir a oficina pelo assunto: diga que o número não está cadastrado " +
    "na equipe e que o dono da oficina pode cadastrá-lo na página Equipe. " +
    "Quando NÃO usar: para fornecedor respondendo sobre peça ou cotação (use " +
    "consultar_pendencias_fornecedor); para lançar consumo, que já identifica pelo número sozinho (use " +
    "lancar_consumo direto, sem passar por aqui).",
  inputSchema: {
    type: "object",
    properties: {
      whatsapp: {
        type: "string",
        pattern: "^\\d{8,15}$",
        description:
          "Número de quem mandou a mensagem, SÓ DÍGITOS, com DDD e DDI quando houver " +
          "(ex.: '5562996106990'). Não acrescente nem remova dígitos do número recebido.",
      },
    },
    required: ["whatsapp"],
    additionalProperties: false,
  },
};

export async function runIdentificarFuncionario(
  creds: Credentials,
  args: unknown,
): Promise<IdentificacaoResponse> {
  const a = objeto(args);
  const whatsapp = textoObrigatorio(a, "whatsapp");
  return apiRequest<IdentificacaoResponse>(
    creds,
    `/estoque/integracao/identificacao?whatsapp=${encodeURIComponent(whatsapp)}`,
    { auth: "servico" },
  );
}
