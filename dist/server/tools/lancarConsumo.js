import { apiRequest } from "../../auth/client.js";
import { objeto, textoObrigatorio } from "./args.js";
export const LANCAR_CONSUMO_TOOL = {
    name: "lancar_consumo",
    title: "Lançar consumo de material a partir de mensagem de WhatsApp",
    description: "Encaminha ao portal uma mensagem de funcionário sobre uso de material da oficina " +
        "(POST /estoque/webhook/whatsapp), ex.: 'usei 500ml de verniz'. O backend identifica o funcionário " +
        "e a oficina PELO NÚMERO de quem mandou, interpreta a frase, e grava o movimento de estoque. " +
        "Passe a mensagem original, sem reescrever nem converter unidades. " +
        "SEMPRE devolva ao funcionário, no WhatsApp, o texto do campo `respostaParaOFuncionario` — ele já " +
        "vem pronto em português e traz a confirmação com o saldo atualizado, ou explica o que faltou " +
        "(número não cadastrado na equipe, material inexistente no estoque, unidade desconhecida, frase " +
        "ambígua). Não escreva confirmação por conta própria. " +
        "`lancamentoRegistrado` diz se algo entrou de fato no estoque; quando for false, nada foi gravado e " +
        "reenviar a mesma mensagem dará o mesmo resultado. " +
        "Quando NÃO usar: para consultar saldo (use consultar_estoque); para cadastrar material novo ou " +
        "corrigir/estornar um lançamento (isso é do painel da oficina); para mensagens que não sejam " +
        "lançamento de material.",
    inputSchema: {
        type: "object",
        properties: {
            from: {
                type: "string",
                pattern: "^\\d{10,15}$",
                description: "Número de quem enviou, SÓ DÍGITOS, com DDD e DDI quando houver (ex.: '5511987654321'). " +
                    "É o que identifica o funcionário e a oficina — número desconhecido não lança nada.",
            },
            message: {
                type: "string",
                maxLength: 1000,
                description: "Texto exato recebido do funcionário, sem edição.",
            },
        },
        required: ["from", "message"],
        additionalProperties: false,
    },
};
export async function runLancarConsumo(creds, args) {
    const a = objeto(args);
    const resposta = await apiRequest(creds, "/estoque/webhook/whatsapp", {
        method: "POST",
        auth: "servico",
        body: {
            from: textoObrigatorio(a, "from", {
                formato: {
                    regex: /^\d{10,15}$/,
                    descricao: "de 10 a 15 dígitos, sem +, espaços, parênteses ou traços",
                },
            }),
            message: textoObrigatorio(a, "message", { max: 1000 }),
        },
    });
    return {
        lancamentoRegistrado: resposta.status === "ok",
        respostaParaOFuncionario: resposta.reply,
        movementId: resposta.movementId ?? null,
        status: resposta.status,
    };
}
