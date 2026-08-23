import { apiRequest } from "../../auth/client.js";
import { objeto, textoOpcional } from "./args.js";
import { resolverEscopo } from "./escopoOficina.js";
export const CONSULTAR_ESTOQUE_TOOL = {
    name: "consultar_estoque",
    title: "Consultar saldo de materiais da oficina",
    description: "Lê o saldo atual dos materiais de uma oficina (GET /estoque). Somente leitura — não movimenta " +
        "nada. Devolve, por item: material (nome e marca), saldo (`quantity`) na unidade de controle " +
        "(`unit`), estoque mínimo (`minQuantity`) e `belowMinimum`, além do resumo `totalItens` e " +
        "`itensAbaixoDoMinimo`. Use para responder 'quanto tem de X?', 'o que está acabando?' e para " +
        "conferir se um material existe no estoque antes de orientar um lançamento. " +
        "Informe `shopId`: sem sessão de usuário não existe oficina implícita. Se o id não existir, a " +
        "resposta é um erro explícito, nunca uma lista vazia — lista vazia significa oficina sem itens " +
        "cadastrados. " +
        "Quando NÃO usar: para registrar consumo ou entrada de material (use lancar_consumo); para saber " +
        "quanto foi gasto num período, por material ou por funcionário (use consultar_balancete); para " +
        "comparar preços de fornecedores (use buscar_fornecedor).",
    inputSchema: {
        type: "object",
        properties: {
            shopId: {
                type: "string",
                description: "UUID da oficina. Obrigatório em chamada de serviço (o normal para a IA). Só pode ser " +
                    "omitido quando o servidor roda com sessão de usuário, e aí vale a oficina da sessão. " +
                    "Não adivinhe o id nem reaproveite o id de outro recurso.",
            },
        },
        additionalProperties: false,
    },
};
export async function runConsultarEstoque(creds, args) {
    const a = objeto(args);
    const escopo = resolverEscopo(creds, textoOpcional(a, "shopId"));
    const itens = await apiRequest(creds, "/estoque", {
        auth: escopo.modo === "servico" ? "servico" : "usuario",
        query: escopo.modo === "servico" ? { shopId: escopo.shopId } : undefined,
    });
    return {
        escopo: { shopId: escopo.shopId, modo: escopo.modo },
        totalItens: itens.length,
        itensAbaixoDoMinimo: itens.filter((item) => item.belowMinimum).length,
        itens,
    };
}
