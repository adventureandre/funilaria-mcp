import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { DEFAULT_API_URL, PACKAGE_NAME } from "../config.js";
import { loadCredentials, saveCredentials } from "../auth/credentials.js";
import { promptHidden, validarUrl } from "./prompt.js";

interface SessionResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: { email?: string; name?: string; role?: string; shopId?: string | null };
}

/**
 * Login de PESSOA (`POST /auth/entrar`). Serve às tools de leitura que ainda
 * dependem de sessão — hoje só `consultar_estoque` sem shopId. Para escrever
 * pelas tools da IA, o comando é `login-servico`.
 */
export async function runLogin(): Promise<void> {
  const atual = await loadCredentials();
  stdout.write("Funilaria MCP — login de usuário\n");
  stdout.write("--------------------------------\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let apiUrl: string;
  let email: string;
  try {
    const padrao = atual.apiUrl || DEFAULT_API_URL;
    const urlInput = (await rl.question(`URL da API [${padrao}]: `)).trim();
    apiUrl = (urlInput.length > 0 ? urlInput : padrao).replace(/\/+$/, "");

    const erroUrl = validarUrl(apiUrl);
    if (erroUrl) {
      stdout.write(`${erroUrl}\n`);
      process.exitCode = 1;
      return;
    }

    email = (await rl.question("E-mail: ")).trim();
  } finally {
    rl.close();
  }

  if (!email) {
    stdout.write("E-mail é obrigatório.\n");
    process.exitCode = 1;
    return;
  }

  const password = await promptHidden("Senha: ");
  if (!password) {
    stdout.write("Senha é obrigatória.\n");
    process.exitCode = 1;
    return;
  }

  stdout.write("Autenticando...\n");
  let res: Response;
  try {
    res = await fetch(`${apiUrl}/auth/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    stdout.write(
      `Não consegui falar com ${apiUrl}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const texto = await res.text();
  let parsed: unknown = null;
  try {
    parsed = texto.length > 0 ? JSON.parse(texto) : null;
  } catch {
    parsed = texto;
  }

  if (!res.ok) {
    const detalhe =
      parsed && typeof parsed === "object" && typeof (parsed as { message?: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `HTTP ${res.status}`;
    stdout.write(`Login falhou: ${detalhe}\n`);
    process.exitCode = 1;
    return;
  }

  const data = (parsed ?? {}) as SessionResponse;
  if (!data.accessToken) {
    stdout.write("A resposta do login não trouxe accessToken.\n");
    process.exitCode = 1;
    return;
  }

  const file = await saveCredentials({
    apiUrl,
    token: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    email: data.user?.email ?? email,
    shopId: data.user?.shopId ?? null,
  });

  stdout.write(`Autenticado como ${data.user?.email ?? email}.\n`);
  if (data.user?.shopId) {
    stdout.write(`Oficina da sessão: ${data.user.shopId}\n`);
  } else {
    stdout.write(
      "Atenção: este usuário não tem oficina vinculada — consultar_estoque vai falhar sem shopId.\n",
    );
  }
  stdout.write(`Credenciais salvas em ${file} (modo 0600).\n`);
  stdout.write(`Registre o MCP com: claude mcp add funilaria -- npx -y ${PACKAGE_NAME}\n`);
}
