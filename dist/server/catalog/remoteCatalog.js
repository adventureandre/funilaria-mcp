import { apiRequest } from "../../auth/client.js";
/**
 * As tools vêm do backend (`GET /mcp/catalogo`), não deste pacote.
 *
 * Antes cada tool nova custava editar aqui, buildar, commitar, publicar e
 * reinstalar o MCP no Aurora — para expor um endpoint que já existia no
 * backend. Com o catálogo remoto, tool nova é commit de um módulo só, e este
 * pacote deixa de ter opinião sobre quais tools existem.
 */
export async function fetchCatalog(creds) {
    try {
        const res = await apiRequest(creds, "/mcp/catalogo", { auth: "servico" });
        return { ok: true, tools: Array.isArray(res?.tools) ? res.tools : [] };
    }
    catch (err) {
        const motivo = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[funilaria-mcp] catálogo indisponível: ${motivo}\n`);
        return { ok: false, tools: [] };
    }
}
/**
 * Aparece na lista do cliente SÓ quando a busca do catálogo falhou.
 *
 * Sem ela o sintoma seria "sumiram as tools", e o diagnóstico começaria pelo
 * lugar errado — foi exatamente o que aconteceu com o catálogo do Aurora, e
 * custou meia hora até alguém reparar que a sessão tinha expirado.
 */
export const CATALOGO_INDISPONIVEL_TOOL = {
    name: "funilaria_catalogo_indisponivel",
    title: "Catálogo do Funilaria indisponível",
    description: "O backend do Funilaria não respondeu GET /mcp/catalogo, então NENHUMA tool do portal está " +
        "disponível nesta sessão — não é que elas não existam. Verifique se FUNILARIA_API_URL aponta para " +
        "o backend certo e se FUNILARIA_SERVICE_SECRET (ou AURORA_WEBHOOK_SECRET) está definido no " +
        "processo deste MCP; o motivo exato saiu no stderr do servidor. Não tente cumprir a tarefa por " +
        "outro caminho: não monte requisição HTTP à mão, não invente URL nem segredo. Avise quem pediu que " +
        "a integração com o portal está fora do ar.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
};
/** Executa uma tool do catálogo — o backend resolve qual serviço ela representa. */
export async function callCatalogTool(creds, name, args) {
    return apiRequest(creds, "/mcp/executar", {
        method: "POST",
        auth: "servico",
        body: { name, args: (args ?? {}) },
    });
}
