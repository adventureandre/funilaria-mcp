/**
 * Validação dos argumentos que chegam do cliente MCP.
 *
 * O backend valida de novo (class-validator), e é ele quem manda. O trabalho
 * aqui é outro: transformar "faltou campo" em uma frase que diga qual campo e
 * o que fazer, ANTES de gastar uma ida à rede — e dar tipo ao `unknown` que o
 * SDK entrega, para o resto do arquivo não precisar de `any`.
 */

export class ArgumentoInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgumentoInvalidoError";
  }
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: false;
  };
}

export function objeto(args: unknown): Record<string, unknown> {
  if (args === undefined || args === null) return {};
  if (typeof args !== "object" || Array.isArray(args)) {
    throw new ArgumentoInvalidoError(
      "Os argumentos da tool precisam ser um objeto JSON.",
    );
  }
  return args as Record<string, unknown>;
}

interface LimitesTexto {
  min?: number;
  max?: number;
  /** Padrão que o campo precisa casar, com a explicação em português. */
  formato?: { regex: RegExp; descricao: string };
}

function validarTexto(campo: string, valor: string, limites: LimitesTexto): string {
  const texto = valor.trim();
  if (limites.min !== undefined && texto.length < limites.min) {
    throw new ArgumentoInvalidoError(
      `"${campo}" precisa ter pelo menos ${limites.min} caracteres (recebi ${texto.length}).`,
    );
  }
  if (limites.max !== undefined && texto.length > limites.max) {
    throw new ArgumentoInvalidoError(
      `"${campo}" excede o limite de ${limites.max} caracteres (recebi ${texto.length}). Encurte antes de reenviar.`,
    );
  }
  if (limites.formato && !limites.formato.regex.test(texto)) {
    throw new ArgumentoInvalidoError(
      `"${campo}" está fora do formato esperado: ${limites.formato.descricao}.`,
    );
  }
  return texto;
}

export function textoObrigatorio(
  args: Record<string, unknown>,
  campo: string,
  limites: LimitesTexto = {},
): string {
  const valor = args[campo];
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new ArgumentoInvalidoError(
      `"${campo}" é obrigatório e deve ser um texto não vazio.`,
    );
  }
  return validarTexto(campo, valor, limites);
}

export function textoOpcional(
  args: Record<string, unknown>,
  campo: string,
  limites: LimitesTexto = {},
): string | undefined {
  const valor = args[campo];
  if (valor === undefined || valor === null || valor === "") return undefined;
  if (typeof valor !== "string") {
    throw new ArgumentoInvalidoError(`"${campo}", quando informado, deve ser texto.`);
  }
  return validarTexto(campo, valor, limites);
}

export function listaDeTextosOpcional(
  args: Record<string, unknown>,
  campo: string,
): string[] | undefined {
  const valor = args[campo];
  if (valor === undefined || valor === null) return undefined;
  if (!Array.isArray(valor) || valor.some((item) => typeof item !== "string")) {
    throw new ArgumentoInvalidoError(`"${campo}", quando informado, deve ser uma lista de textos.`);
  }
  const itens = (valor as string[]).map((item) => item.trim()).filter((item) => item.length > 0);
  return itens.length > 0 ? itens : undefined;
}

export function inteiroOpcional(
  args: Record<string, unknown>,
  campo: string,
  limites: { min?: number; max?: number } = {},
): number | undefined {
  const valor = args[campo];
  if (valor === undefined || valor === null) return undefined;
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

export function enumOpcional<T extends string>(
  args: Record<string, unknown>,
  campo: string,
  valores: readonly T[],
): T | undefined {
  const valor = args[campo];
  if (valor === undefined || valor === null || valor === "") return undefined;
  if (typeof valor !== "string" || !valores.includes(valor as T)) {
    throw new ArgumentoInvalidoError(
      `"${campo}" deve ser um destes valores: ${valores.join(", ")}.`,
    );
  }
  return valor as T;
}
