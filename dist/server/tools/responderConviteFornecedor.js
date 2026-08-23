import { apiRequest } from "../../auth/client.js";
import { booleanoObrigatorio, objeto, textoObrigatorio, } from "./args.js";
export const RESPONDER_CONVITE_FORNECEDOR_TOOL = {
    name: "responder_convite_fornecedor",
    title: "Registrar o aceite ou a recusa do fornecedor ao convite",
    description: "Registra no portal a resposta do fornecedor ao convite de opt-in " +
        "(POST /fornecedores/webhook/convite-resposta). " +
        "COMO CHEGAR AQUI: a mensagem do fornecedor vem só com o telefone, sem dizer a que ela responde. " +
        "Chame antes consultar_pendencias_fornecedor com o número dele: se voltar " +
        "fornecedor.conviteStatus = 'ENVIADO' e nenhuma consulta em aberto, a mensagem é resposta de " +
        "convite — use o fornecedor.id de lá como supplierId. Não invente o id nem reaproveite candidateId. " +
        "QUEM DECIDE SE FOI ACEITE É VOCÊ: mande aceitou=true para 'sim', 'pode mandar', 'topo', 'claro'; " +
        "aceitou=false para 'não', 'não quero', 'me tira da lista'. Se a resposta for ambígua ou for uma " +
        "pergunta de volta ('quem é vocês?'), NÃO chame esta tool — responda a dúvida e espere uma resposta " +
        "clara, porque aceitou=true liga o contato automático e não há segundo convite. " +
        "EFEITOS de aceitou=true: liga whatsappOptIn e aiContactEnabled, torna o cadastro PÚBLICO (ele passa " +
        "a atender todas as oficinas, não só a que o convidou) e ativa o fornecedor. Com aceitou=false o " +
        "contato automático fica desligado e o opt-out é datado. " +
        "DEVOLVE { id, name, inviteStatus, visibility, whatsappOptIn } com o estado já gravado: confirme ao " +
        "fornecedor só depois de ver inviteStatus='ACEITO' (ou 'RECUSADO'). Se vier diferente do que você " +
        "mandou, não insista nem chame de novo — diga que houve um problema no registro. " +
        "QUANDO NÃO USAR: para resposta a uma busca de peça (use responder_busca_peca) e para quem já está " +
        "com conviteStatus 'ACEITO' ou 'RECUSADO' — o convite é único e não se responde duas vezes.",
    inputSchema: {
        type: "object",
        properties: {
            supplierId: {
                type: "string",
                description: "Id do fornecedor, vindo de fornecedor.id na resposta de consultar_pendencias_fornecedor.",
            },
            message: {
                type: "string",
                maxLength: 1000,
                description: "Texto exato que o fornecedor mandou, sem editar nem resumir — fica no log de consentimento.",
            },
            aceitou: {
                type: "boolean",
                description: "true quando ele concordou em receber as consultas; false quando recusou.",
            },
        },
        required: ["supplierId", "message", "aceitou"],
        additionalProperties: false,
    },
};
export async function runResponderConviteFornecedor(creds, args) {
    const a = objeto(args);
    return apiRequest(creds, "/fornecedores/webhook/convite-resposta", {
        method: "POST",
        auth: "servico",
        body: {
            supplierId: textoObrigatorio(a, "supplierId"),
            message: textoObrigatorio(a, "message", { max: 1000 }),
            aceitou: booleanoObrigatorio(a, "aceitou"),
        },
    });
}
