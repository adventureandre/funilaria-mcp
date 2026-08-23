/**
 * Base da API do portal. O padrão é o backend local porque a URL de produção
 * muda por ambiente — quem publica define na env, e nada de host chutado dentro
 * do pacote.
 */
export const DEFAULT_API_URL = "http://localhost:3334";
export const PACKAGE_NAME = "@expertcustom/funilaria-mcp";
export const SERVER_NAME = "funilaria-mcp";
export const SERVER_VERSION = "0.1.0";
/** Pasta em ~/.config (ou $XDG_CONFIG_HOME) onde a credencial é guardada. */
export const CONFIG_DIR_NAME = "funilaria-mcp";
/**
 * Configuração por env é o caminho PRINCIPAL: em produção quem sobe este
 * servidor é o runtime do Aurora, que injeta as variáveis no processo — não há
 * terminal para rodar `login`, e o segredo não deve sair do cofre do
 * orquestrador para o home de ninguém. O arquivo de credenciais existe para o
 * desenvolvimento local e sempre perde para a env.
 *
 * Cada campo aceita mais de um nome: o primeiro é o canônico, os demais são
 * apelidos que evitam o erro clássico de copiar o `.env` do backend e o
 * segredo "sumir" por causa do prefixo diferente.
 */
export const ENV_VARS = {
    apiUrl: ["FUNILARIA_API_URL", "PUBLIC_API_URL"],
    serviceSecret: ["FUNILARIA_SERVICE_SECRET", "AURORA_WEBHOOK_SECRET"],
    signingSecret: ["FUNILARIA_SIGNING_SECRET", "AURORA_WEBHOOK_SIGNING_SECRET"],
    token: ["FUNILARIA_TOKEN"],
    shopId: ["FUNILARIA_SHOP_ID"],
};
/** Primeiro nome preenchido, junto do nome — o `status` mostra de onde veio. */
export function envValue(nomes) {
    for (const nome of nomes) {
        const valor = process.env[nome];
        if (valor !== undefined && valor.length > 0)
            return { nome, valor };
    }
    return null;
}
