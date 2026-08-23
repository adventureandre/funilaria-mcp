import { requireToken } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import { ArgumentoInvalidoError } from "./args.js";

/**
 * Como a oficina é determinada nas rotas de estoque.
 *
 * O caminho principal é `servico`: credencial de serviço + `shopId` explícito,
 * que é o desenho do `@AllowService()` no backend — uma IA que atende várias
 * oficinas não tem sessão, e derivar oficina de sessão foi o que produziu a
 * inconsistência original. O modo `usuario` sobrou para o desenvolvimento
 * local, onde alguém já tem um JWT na mão e quer olhar a própria oficina.
 */
export type EscopoOficina =
  | { modo: "servico"; shopId: string }
  | { modo: "usuario"; shopId: null };

export function resolverEscopo(
  creds: Credentials,
  explicito: string | undefined,
): EscopoOficina {
  const shopId = explicito ?? creds.shopId ?? null;

  if (creds.serviceSecret && shopId) return { modo: "servico", shopId };

  if (creds.token) {
    // Com sessão, quem decide a oficina é o ShopContextGuard. Aceitar o
    // parâmetro aqui seria uma promessa que a rota não cumpre: o backend
    // devolveria a oficina da sessão como se fosse a pedida.
    if (explicito) {
      throw new ArgumentoInvalidoError(
        "Para consultar uma oficina específica é preciso credencial de serviço " +
          "(env FUNILARIA_SERVICE_SECRET). Com login de usuário, omita `shopId`: a oficina vem da sessão.",
      );
    }
    return { modo: "usuario", shopId: null };
  }

  if (creds.serviceSecret) {
    throw new ArgumentoInvalidoError(
      "Informe `shopId`: a chamada usa credencial de serviço e, sem sessão, não existe oficina " +
        "implícita. Se este servidor atende sempre a mesma oficina, defina a env FUNILARIA_SHOP_ID.",
    );
  }

  // Nenhuma credencial: a mensagem de `requireToken` explica o que configurar.
  requireToken(creds);
  throw new ArgumentoInvalidoError("Credencial ausente.");
}
