import { requireToken } from "../../auth/client.js";
import { ArgumentoInvalidoError } from "./args.js";
export function resolverEscopo(creds, explicito) {
    const shopId = explicito ?? creds.shopId ?? null;
    if (creds.serviceSecret && shopId)
        return { modo: "servico", shopId };
    if (creds.token) {
        // Com sessão, quem decide a oficina é o ShopContextGuard. Aceitar o
        // parâmetro aqui seria uma promessa que a rota não cumpre: o backend
        // devolveria a oficina da sessão como se fosse a pedida.
        if (explicito) {
            throw new ArgumentoInvalidoError("Para consultar uma oficina específica é preciso credencial de serviço " +
                "(env FUNILARIA_SERVICE_SECRET). Com login de usuário, omita `shopId`: a oficina vem da sessão.");
        }
        return { modo: "usuario", shopId: null };
    }
    if (creds.serviceSecret) {
        throw new ArgumentoInvalidoError("Informe `shopId`: a chamada usa credencial de serviço e, sem sessão, não existe oficina " +
            "implícita. Se este servidor atende sempre a mesma oficina, defina a env FUNILARIA_SHOP_ID.");
    }
    // Nenhuma credencial: a mensagem de `requireToken` explica o que configurar.
    requireToken(creds);
    throw new ArgumentoInvalidoError("Credencial ausente.");
}
