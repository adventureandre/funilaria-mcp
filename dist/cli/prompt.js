import { stdin, stdout } from "node:process";
/** Leitura sem eco, para segredo não ficar no scrollback nem no histórico. */
export function promptHidden(prompt) {
    return new Promise((resolve, reject) => {
        stdout.write(prompt);
        const wasRaw = stdin.isRaw === true;
        try {
            stdin.setRawMode?.(true);
        }
        catch (err) {
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
            }
            catch {
                // ignore
            }
            stdin.pause();
        };
        const onData = (chunk) => {
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
/**
 * HTTPS é obrigatório fora da máquina local: tanto o JWT quanto o segredo de
 * serviço viajam em header, e em texto claro qualquer proxy no caminho os lê.
 */
export function validarUrl(url) {
    if (/^https:\/\//i.test(url))
        return null;
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url))
        return null;
    return "A URL da API precisa usar HTTPS (http só é aceito em localhost).";
}
