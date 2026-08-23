#!/usr/bin/env node
import { runLogin } from "./cli/login.js";
import { runLoginServico } from "./cli/loginServico.js";
import { startServer } from "./server/server.js";
import { clearCredentials, credentialsLocation, describeCredentials, loadCredentials, } from "./auth/credentials.js";
import { PACKAGE_NAME } from "./config.js";
function printHelp() {
    process.stdout.write(`${PACKAGE_NAME}\n\n` +
        `Uso:\n` +
        `  npx ${PACKAGE_NAME}                 Sobe o servidor MCP em stdio (padrão).\n` +
        `  npx ${PACKAGE_NAME} status          Mostra o que está configurado e de onde veio.\n` +
        `  npx ${PACKAGE_NAME} login-servico   [dev] Guarda a credencial de serviço em ~/.config.\n` +
        `  npx ${PACKAGE_NAME} login           [dev] Autentica um usuário (JWT) para consultar_estoque.\n` +
        `  npx ${PACKAGE_NAME} logout          Apaga as credenciais salvas em disco.\n` +
        `  npx ${PACKAGE_NAME} --help          Esta mensagem.\n\n` +
        `Configuração por env (caminho principal — é assim que o Aurora sobe o servidor):\n` +
        `  FUNILARIA_API_URL         base da API do portal\n` +
        `  FUNILARIA_SERVICE_SECRET  segredo de serviço; = AURORA_WEBHOOK_SECRET do backend\n` +
        `  FUNILARIA_SIGNING_SECRET  segredo da assinatura HMAC (opcional)\n` +
        `  FUNILARIA_SHOP_ID         oficina padrão de consultar_estoque (opcional)\n` +
        `  FUNILARIA_TOKEN           JWT de usuário, se houver (opcional)\n` +
        `As envs têm precedência sobre o arquivo de credenciais e não tocam o disco.\n`);
}
async function runStatus() {
    const creds = await loadCredentials();
    const resumo = describeCredentials(creds);
    const linhas = [
        ...resumo.linhas,
        `Arquivo de credenciais: ${credentialsLocation()}`,
        `Atualizado em: ${creds.savedAt}`,
    ];
    process.stdout.write(`${linhas.join("\n")}\n`);
    if (!resumo.temServico && !resumo.temUsuario) {
        process.stdout.write("\nNada configurado. Em produção, defina FUNILARIA_SERVICE_SECRET e FUNILARIA_API_URL no " +
            `ambiente do processo. No desenvolvimento local, \`npx ${PACKAGE_NAME} login-servico\`.\n`);
        process.exitCode = 1;
    }
}
async function main() {
    const cmd = process.argv[2];
    if (cmd === "--help" || cmd === "-h" || cmd === "help") {
        printHelp();
        return;
    }
    if (cmd === "login") {
        await runLogin();
        return;
    }
    if (cmd === "login-servico") {
        await runLoginServico();
        return;
    }
    if (cmd === "logout") {
        await clearCredentials();
        process.stdout.write("Credenciais removidas.\n");
        return;
    }
    if (cmd === "status") {
        await runStatus();
        return;
    }
    if (cmd && cmd !== "serve") {
        process.stderr.write(`Comando desconhecido: ${cmd}\n`);
        printHelp();
        process.exitCode = 1;
        return;
    }
    await startServer();
}
main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
    process.exit(1);
});
