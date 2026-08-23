import { apiRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import { objeto, textoOpcional, type ToolDefinition } from "./args.js";
import { resolverEscopo } from "./escopoOficina.js";

/** Resposta de `GET /estoque/balancete` (InventoryService.balance). */
interface BalanceteResponse {
  periodo: { de: string; ate: string };
  porMaterial: {
    materialId: string;
    name: string;
    unit: string;
    consumo: number;
    entrada: number;
    perda: number;
    custo: number;
  }[];
  porFuncionario: {
    memberId: string | null;
    name: string;
    lancamentos: number;
    custo: number;
  }[];
  totalMovimentos: number;
}

interface BalanceteResult extends BalanceteResponse {
  escopo: { shopId: string | null; modo: "servico" | "usuario" };
}

/** Aceita '2026-08-01' e ISO completo — os dois passam no @IsDateString do backend. */
const DATA_ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/;

export const CONSULTAR_BALANCETE_TOOL: ToolDefinition = {
  name: "consultar_balancete",
  title: "Balancete de consumo de materiais por período",
  description:
    "Resume o que a oficina consumiu, entrou e perdeu de material num período, com o custo em reais " +
    "(GET /estoque/balancete). Somente leitura. É a resposta para 'quanto gastei de verniz esse mês?', " +
    "'quem mais consumiu material?' e 'quanto custou o material em setembro?'. " +
    "Devolve `periodo`, `porMaterial` (consumo, entrada, perda na unidade do item e `custo` em R$), " +
    "`porFuncionario` (lançamentos e custo, considerando apenas saídas e perdas) e `totalMovimentos`. " +
    "Sem `from`/`to`, o período é do primeiro dia do mês corrente até agora. Movimento lançado sem " +
    "preço — o caso normal do WhatsApp — é valorado pelo custo médio do item; item que nunca teve " +
    "entrada com preço entra com custo zero, então trate custo 0 como 'sem preço registrado', não como " +
    "'de graça'. " +
    "Quando NÃO usar: para saber o saldo atual (use consultar_estoque); para registrar consumo (use " +
    "lancar_consumo); para a lista movimento a movimento, que esta tool não expõe.",
  inputSchema: {
    type: "object",
    properties: {
      shopId: {
        type: "string",
        description:
          "UUID da oficina. Obrigatório em chamada de serviço (o normal para a IA); omitido, vale a " +
          "oficina da sessão de usuário, quando houver.",
      },
      from: {
        type: "string",
        description:
          "Início do período, ISO ('2026-08-01' ou data-hora completa). Padrão: primeiro dia do mês corrente.",
      },
      to: {
        type: "string",
        description: "Fim do período, ISO. Padrão: agora.",
      },
      memberId: {
        type: "string",
        description:
          "UUID de um funcionário (ShopMember) para filtrar só os lançamentos dele. O id vem do campo " +
          "`memberId` de `porFuncionario`; não use o número de WhatsApp nem o nome.",
      },
    },
    additionalProperties: false,
  },
};

export async function runConsultarBalancete(
  creds: Credentials,
  args: unknown,
): Promise<BalanceteResult> {
  const a = objeto(args);
  const escopo = resolverEscopo(creds, textoOpcional(a, "shopId"));

  const formatoData = { regex: DATA_ISO, descricao: "data ISO, ex.: '2026-08-01'" };
  const resposta = await apiRequest<BalanceteResponse>(creds, "/estoque/balancete", {
    auth: escopo.modo === "servico" ? "servico" : "usuario",
    query: {
      shopId: escopo.modo === "servico" ? escopo.shopId : undefined,
      from: textoOpcional(a, "from", { formato: formatoData }),
      to: textoOpcional(a, "to", { formato: formatoData }),
      memberId: textoOpcional(a, "memberId"),
    },
  });

  return { escopo: { shopId: escopo.shopId, modo: escopo.modo }, ...resposta };
}
