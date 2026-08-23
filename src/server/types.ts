/**
 * Formato de uma tool, como o cliente MCP a publica para o modelo.
 *
 * O catálogo vem do backend (`GET /mcp/catalogo`); este tipo existe só para
 * dar forma ao que chega, e não para descrevê-lo — quem define as tools é o
 * backend, e este pacote não tem opinião sobre quais existem.
 */
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

/**
 * Erro de argumento vindo do backend, já em português.
 *
 * Mantido como classe própria porque o `errorContent` distingue erro que a IA
 * consegue corrigir (argumento) de falha inesperada, e a distinção muda o que
 * ela faz a seguir.
 */
export class ArgumentoInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgumentoInvalidoError";
  }
}
