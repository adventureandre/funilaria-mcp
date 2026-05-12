import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { DEFAULT_AURORA_URL } from "../config.js";
import { saveCredentials, credentialsLocation } from "../auth/credentials.js";

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

function promptHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    const wasRaw = stdin.isRaw === true;
    try {
      stdin.setRawMode?.(true);
    } catch (err) {
      reject(err);
      return;
    }
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      try {
        stdin.setRawMode?.(wasRaw);
      } catch {
        // ignore
      }
      stdin.pause();
    };

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        const code = ch.charCodeAt(0);
        if (ch === "\r" || ch === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (code === 3) {
          cleanup();
          process.exit(130);
        }
        if (code === 127 || code === 8) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        if (code >= 32) {
          value += ch;
          stdout.write("*");
        }
      }
    };

    stdin.on("data", onData);
  });
}

export async function runLogin(): Promise<void> {
  stdout.write("Aurora MCP login\n");
  stdout.write("----------------\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let auroraUrl: string;
  let email: string;
  try {
    const urlInput = (
      await rl.question(`Aurora API URL [${DEFAULT_AURORA_URL}]: `)
    ).trim();
    auroraUrl =
      urlInput.length > 0 ? urlInput.replace(/\/+$/, "") : DEFAULT_AURORA_URL;

    email = (await rl.question("Email: ")).trim();
  } finally {
    rl.close();
  }

  if (!email) {
    stdout.write("Email is required.\n");
    process.exitCode = 1;
    return;
  }

  const password = await promptHidden("Password: ");
  if (!password) {
    stdout.write("Password is required.\n");
    process.exitCode = 1;
    return;
  }

  stdout.write("Authenticating...\n");
  const res = await fetch(`${auroraUrl}/dashboard/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  let parsed: any;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const message = parsed?.message ?? `HTTP ${res.status}`;
    stdout.write(`Login failed: ${message}\n`);
    process.exitCode = 1;
    return;
  }

  const data = parsed as LoginResponse;
  if (!data?.token) {
    stdout.write("Login response did not contain a token.\n");
    process.exitCode = 1;
    return;
  }

  const file = await saveCredentials({
    auroraUrl,
    token: data.token,
    email: data.user?.email ?? email,
    savedAt: new Date().toISOString(),
  });

  stdout.write(`Logged in as ${data.user?.email ?? email}.\n`);
  stdout.write(`Credentials saved to ${file} (mode 0600).\n`);
  stdout.write(
    "Add this MCP to Claude Code by running it as: npx @expertcustom/aurora-mcp\n",
  );
}

export function describeCredentialsPath(): string {
  return credentialsLocation();
}
