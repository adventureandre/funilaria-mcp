/**
 * Erro de argumento vindo do backend, já em português.
 *
 * Mantido como classe própria porque o `errorContent` distingue erro que a IA
 * consegue corrigir (argumento) de falha inesperada, e a distinção muda o que
 * ela faz a seguir.
 */
export class ArgumentoInvalidoError extends Error {
    constructor(message) {
        super(message);
        this.name = "ArgumentoInvalidoError";
    }
}
