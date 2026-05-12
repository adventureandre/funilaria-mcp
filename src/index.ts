#!/usr/bin/env node
import { runLogin } from "./cli/login.js";
import { startServer } from "./server/server.js";
import { clearCredentials, credentialsLocation, loadCredentials } from "./auth/credentials.js";
import { PACKAGE_NAME } from "./config.js";

function printHelp(): void {
  process.stdout.write(
    `${PACKAGE_NAME}\n\n` +
      `Usage:\n` +
      `  npx ${PACKAGE_NAME}           Run the MCP server over stdio (default).\n` +
      `  npx ${PACKAGE_NAME} login     Authenticate against Aurora and store credentials.\n` +
      `  npx ${PACKAGE_NAME} logout    Remove stored credentials.\n` +
      `  npx ${PACKAGE_NAME} status    Show current credential info.\n` +
      `  npx ${PACKAGE_NAME} --help    Show this message.\n`,
  );
}

async function runStatus(): Promise<void> {
  const creds = await loadCredentials();
  if (!creds) {
    process.stdout.write(
      `Not logged in. Run \`npx ${PACKAGE_NAME} login\` first.\n`,
    );
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `Logged in as ${creds.email}\n` +
      `Aurora URL: ${creds.auroraUrl}\n` +
      `Credentials file: ${credentialsLocation()}\n` +
      `Saved at: ${creds.savedAt}\n`,
  );
}

async function runLogout(): Promise<void> {
  await clearCredentials();
  process.stdout.write("Credentials removed.\n");
}

async function main(): Promise<void> {
  const cmd = process.argv[2];

  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    printHelp();
    return;
  }
  if (cmd === "login") {
    await runLogin();
    return;
  }
  if (cmd === "logout") {
    await runLogout();
    return;
  }
  if (cmd === "status") {
    await runStatus();
    return;
  }
  if (cmd && cmd !== "serve") {
    process.stderr.write(`Unknown command: ${cmd}\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  await startServer();
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
