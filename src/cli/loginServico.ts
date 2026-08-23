import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { DEFAULT_API_URL, ENV_VARS } from "../config.js";
import { loadCredentials, saveCredentials } from "../auth/credentials.js";
import { promptHidden, validarUrl } from "./prompt.js";

/**
 * Credencial de SERVIÇO para DESENVOLVIMENTO LOCAL. Em produção quem configura
 * é o runtime do Aurora, por env (`FUNILARIA_SERVICE_SECRET`) — lá não existe
 * terminal para rodar comando nenhum. Este atalho existe para quem testa na
 * própria máquina não precisar exportar variável a cada shell novo.
 *
 * É ela que autoriza as tools de escrita da IA (`publicar_noticia`,
 * `responder_busca_peca`, `lancar_consumo`). Não há usuário do outro lado,
 * então não há o que "logar" — o comando só guarda o segredo no mesmo cofre do
 * login humano, com permissão 0600.
 *
 * Não existe endpoint para conferir o segredo antes de gravar, e não vale
 * inventar um disparo de teste que escreveria no portal. A validação real
 * acontece na primeira tool, com mensagem própria para o 401.
 */
export async function runLoginServico(): Promise<void> {
  const atual = await loadCredentials();
  stdout.write("Funilaria MCP — credencial de serviço\n");
  stdout.write("-------------------------------------\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let apiUrl: string;
  let shopId: string;
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

    stdout.write(
      "\nO segredo é o mesmo valor de AURORA_WEBHOOK_SECRET no backend. Peça ao responsável;\n" +
        "ele não fica em nenhum prompt de IA e não deve ser colado em conversa.\n",
    );
    const secret = await promptHidden("Segredo de serviço: ");
    if (!secret) {
      stdout.write("Segredo é obrigatório.\n");
      process.exitCode = 1;
      return;
    }

    stdout.write(
      "\nSegredo de assinatura HMAC (opcional, ADR-001). Deixe vazio se o backend ainda não verifica.\n",
    );
    const signing = await promptHidden("Segredo de assinatura: ");

    shopId = (
      await rl.question(
        "\nOficina padrão para consultar_estoque (UUID, opcional, Enter para pular): ",
      )
    ).trim();

    const file = await saveCredentials({
      apiUrl,
      serviceSecret: secret,
      signingSecret: signing.length > 0 ? signing : null,
      ...(shopId.length > 0 ? { shopId } : {}),
    });

    stdout.write(`\nCredencial de serviço salva em ${file} (modo 0600).\n`);
    stdout.write(
      `Em produção (runtime do Aurora) NÃO use este comando: defina ${ENV_VARS.serviceSecret[0]} e ` +
        `${ENV_VARS.apiUrl[0]} no ambiente do processo. As envs têm precedência sobre este arquivo e ` +
        "não deixam o segredo em disco.\n",
    );
  } finally {
    rl.close();
  }
}
