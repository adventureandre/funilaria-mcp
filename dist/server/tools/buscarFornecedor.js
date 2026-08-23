import { apiRequest } from "../../auth/client.js";
import { enumOpcional, inteiroOpcional, objeto, textoOpcional, } from "./args.js";
const TIPOS = ["PECAS", "MATERIAIS", "AMBOS"];
export const BUSCAR_FORNECEDOR_TOOL = {
    name: "buscar_fornecedor",
    title: "Buscar fornecedores no diretório",
    description: "Lista fornecedores ATIVOS do diretório do portal (GET /fornecedores), com filtros por nome, tipo " +
        "(peças ou materiais), categoria, cidade e estado. Somente leitura. " +
        "Devolve { items, total, page, perPage, pages }; cada item traz nome, slug, tipo, contatos " +
        "públicos, endereço e `verified`. Use para responder 'quem vende X na região?', para achar o id de " +
        "um fornecedor e para conferir se um fornecedor já está cadastrado antes de sugerir cadastro. " +
        "Filtragem por categoria exige o UUID da categoria (partCategoryId / materialCategoryId); se você " +
        "não tem o UUID em mãos, filtre por `q`, `city` e `state` em vez de adivinhar um id. " +
        "Quando NÃO usar: para perguntar preço ou disponibilidade de peça a um fornecedor — isso é o fluxo " +
        "de busca de peças, iniciado pela oficina no painel, e as respostas voltam por " +
        "responder_busca_peca; e para criar ou editar cadastro de fornecedor, que não é exposto aqui.",
    inputSchema: {
        type: "object",
        properties: {
            q: { type: "string", description: "Trecho do nome do fornecedor." },
            type: {
                type: "string",
                enum: [...TIPOS],
                description: "PECAS ou MATERIAIS filtram por especialidade e já incluem quem atende AMBOS. " +
                    "Passar AMBOS traz só os que se declaram dos dois tipos.",
            },
            partCategoryId: {
                type: "string",
                description: "UUID de uma categoria de peça atendida pelo fornecedor.",
            },
            materialCategoryId: {
                type: "string",
                description: "UUID de uma categoria de material atendida pelo fornecedor.",
            },
            city: { type: "string", description: "Cidade (casa por trecho, sem acento obrigatório)." },
            state: {
                type: "string",
                description: "UF com duas letras maiúsculas, ex.: 'SP'.",
            },
            radiusKm: {
                type: "integer",
                minimum: 1,
                maximum: 500,
                description: "Raio em km a partir da oficina do usuário. Só tem efeito em sessão de usuário com oficina; " +
                    "sem isso a ordenação é por verificado e nome, e `distanceKm` volta null.",
            },
            page: { type: "integer", minimum: 1, description: "Página, começando em 1." },
            perPage: { type: "integer", minimum: 1, maximum: 100, description: "Itens por página (máx. 100)." },
        },
        additionalProperties: false,
    },
};
export async function runBuscarFornecedor(creds, args) {
    const a = objeto(args);
    return apiRequest(creds, "/fornecedores", {
        // Rota pública; o Bearer vai junto quando existe, para o backend poder
        // ordenar por distância da oficina do usuário.
        auth: "publico",
        query: {
            q: textoOpcional(a, "q"),
            type: enumOpcional(a, "type", TIPOS),
            partCategoryId: textoOpcional(a, "partCategoryId"),
            materialCategoryId: textoOpcional(a, "materialCategoryId"),
            city: textoOpcional(a, "city"),
            state: textoOpcional(a, "state", {
                formato: { regex: /^[A-Z]{2}$/, descricao: "duas letras maiúsculas, ex.: 'SP'" },
            }),
            radiusKm: inteiroOpcional(a, "radiusKm", { min: 1, max: 500 }),
            page: inteiroOpcional(a, "page", { min: 1 }),
            perPage: inteiroOpcional(a, "perPage", { min: 1, max: 100 }),
        },
    });
}
