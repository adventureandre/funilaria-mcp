import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface Credentials {
  auroraUrl: string;
  token: string;
  email: string;
  savedAt: string;
}

function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), ".config");
  return path.join(base, "aurora-mcp");
}

function credentialsPath(): string {
  return path.join(configDir(), "credentials.json");
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const raw = await fs.readFile(credentialsPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<Credentials>;
    if (!parsed.auroraUrl || !parsed.token || !parsed.email) return null;
    return {
      auroraUrl: parsed.auroraUrl,
      token: parsed.token,
      email: parsed.email,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch (err: any) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

export async function saveCredentials(creds: Credentials): Promise<string> {
  const dir = configDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const file = credentialsPath();
  await fs.writeFile(file, JSON.stringify(creds, null, 2), { mode: 0o600 });
  return file;
}

export async function clearCredentials(): Promise<void> {
  try {
    await fs.unlink(credentialsPath());
  } catch (err: any) {
    if (err?.code !== "ENOENT") throw err;
  }
}

export function credentialsLocation(): string {
  return credentialsPath();
}
