/**
 * Validação dos argumentos que chegam do cliente MCP.
 *
 * O backend valida de novo (class-validator), e é ele quem manda. O trabalho
 * aqui é outro: transformar "faltou campo" em uma frase que diga qual campo e
 * o que fazer, ANTES de gastar uma ida à rede — e dar tipo ao `unknown` que o
 * SDK entrega, para o resto do arquivo não precisar de `any`.
 */
export class ArgumentoInvalidoError extends Error {
    constructor(message) {
        super(message);
        this.name = "ArgumentoInvalidoError";
    }
}
export function objeto(args) {
    if (args === undefined || args === null)
        return {};
    if (typeof args !== "object" || Array.isArray(args)) {
        throw new ArgumentoInvalidoError("Os argumentos da tool precisam ser um objeto JSON.");
    }
    return args;
}
function validarTexto(campo, valor, limites) {
    const texto = valor.trim();
    if (limites.min !== undefined && texto.length < limites.min) {
        throw new ArgumentoInvalidoError(`"${campo}" precisa ter pelo menos ${limites.min} caracteres (recebi ${texto.length}).`);
    }
    if (limites.max !== undefined && texto.length > limites.max) {
        throw new ArgumentoInvalidoError(`"${campo}" excede o limite de ${limites.max} caracteres (recebi ${texto.length}). Encurte antes de reenviar.`);
    }
    if (limites.formato && !limites.formato.regex.test(texto)) {
        throw new ArgumentoInvalidoError(`"${campo}" está fora do formato esperado: ${limites.formato.descricao}.`);
    }
    return texto;
}
export function textoObrigatorio(args, campo, limites = {}) {
    const valor = args[campo];
    if (typeof valor !== "string" || valor.trim().length === 0) {
        throw new ArgumentoInvalidoError(`"${campo}" é obrigatório e deve ser um texto não vazio.`);
    }
    return validarTexto(campo, valor, limites);
}
export function textoOpcional(args, campo, limites = {}) {
    const valor = args[campo];
    if (valor === undefined || valor === null || valor === "")
        return undefined;
    if (typeof valor !== "string") {
        throw new ArgumentoInvalidoError(`"${campo}", quando informado, deve ser texto.`);
    }
    return validarTexto(campo, valor, limites);
}
export function listaDeTextosOpcional(args, campo) {
    const valor = args[campo];
    if (valor === undefined || valor === null)
        return undefined;
    if (!Array.isArray(valor) || valor.some((item) => typeof item !== "string")) {
        throw new ArgumentoInvalidoError(`"${campo}", quando informado, deve ser uma lista de textos.`);
    }
    const itens = valor.map((item) => item.trim()).filter((item) => item.length > 0);
    return itens.length > 0 ? itens : undefined;
}
export function inteiroOpcional(args, campo, limites = {}) {
    const valor = args[campo];
    if (valor === undefined || valor === null)
        return undefined;
    const numero = typeof valor === "string" ? Number(valor) : valor;
    if (typeof numero !== "number" || !Number.isInteger(numero)) {
        throw new ArgumentoInvalidoError(`"${campo}", quando informado, deve ser um número inteiro.`);
    }
    if (limites.min !== undefined && numero < limites.min) {
        throw new ArgumentoInvalidoError(`"${campo}" precisa ser no mínimo ${limites.min}.`);
    }
    if (limites.max !== undefined && numero > limites.max) {
        throw new ArgumentoInvalidoError(`"${campo}" precisa ser no máximo ${limites.max}.`);
    }
    return numero;
}
export function enumOpcional(args, campo, valores) {
    const valor = args[campo];
    if (valor === undefined || valor === null || valor === "")
        return undefined;
    if (typeof valor !== "string" || !valores.includes(valor)) {
        throw new ArgumentoInvalidoError(`"${campo}" deve ser um destes valores: ${valores.join(", ")}.`);
    }
    return valor;
}
/**
 * Booleano estrito, com uma concessão: aceita "true"/"false" em texto.
 *
 * O modelo às vezes serializa booleano como string ao montar os argumentos, e
 * recusar isso transformaria um aceite legítimo do fornecedor em erro de
 * argumento — barulho que o operador não tem como consertar.
 */
export function booleanoObrigatorio(args, campo) {
    const valor = args[campo];
    if (typeof valor === "boolean")
        return valor;
    if (valor === "true")
        return true;
    if (valor === "false")
        return false;
    throw new ArgumentoInvalidoError(`"${campo}" é obrigatório e deve ser true ou false.`);
}
