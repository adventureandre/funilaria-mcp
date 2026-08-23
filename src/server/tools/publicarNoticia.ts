import { apiRequest } from "../../auth/client.js";
import type { Credentials } from "../../auth/credentials.js";
import {
  listaDeTextosOpcional,
  objeto,
  textoObrigatorio,
  textoOpcional,
  type ToolDefinition,
} from "./args.js";

/** Resposta de `POST /noticias/ingestao` (NewsService.ingest). */
interface IngestaoResponse {
  id: string;
  slug: string;
  status: "rascunho" | "ja-publicada";
}

export const PUBLICAR_NOTICIA_TOOL: ToolDefinition = {
  name: "publicar_noticia",
  title: "Enviar matéria para o CMS (rascunho)",
  description:
    "Entrega uma matéria de notícia ao portal Funilaria & Pintura (POST /noticias/ingestao). " +
    "A matéria SEMPRE entra como RASCUNHO: nenhum parâmetro desta tool publica nada, e a publicação " +
    "continua sendo decisão de um editor humano no painel /admin/noticias. " +
    "Devolve { id, slug, status }: status 'rascunho' quando o rascunho foi criado ou atualizado, e " +
    "'ja-publicada' quando já existe uma matéria PUBLICADA com o mesmo slug — nesse caso nada foi " +
    "alterado, e insistir com o mesmo título terá o mesmo efeito. " +
    "O slug é derivado do título, então reenviar o mesmo título sobrescreve o rascunho anterior em vez " +
    "de criar outro; para uma matéria nova use um título diferente. " +
    "Quando NÃO usar: para editar, publicar, agendar ou apagar matéria existente (isso é do painel do " +
    "editor, não desta tool); para publicar texto sem checar a fonte; e para conteúdo que não seja " +
    "notícia do setor de funilaria, pintura, peças ou mercado automotivo.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        minLength: 5,
        maxLength: 200,
        description: "Título da matéria, em português. Vira o slug do post.",
      },
      content: {
        type: "string",
        minLength: 50,
        description:
          "Corpo da matéria em Markdown. Se sourceUrl for informado, o crédito à fonte é anexado " +
          "automaticamente no rodapé pelo backend — não escreva o crédito no texto.",
      },
      excerpt: {
        type: "string",
        maxLength: 400,
        description: "Resumo de chamada (aparece na listagem). Opcional.",
      },
      coverUrl: {
        type: "string",
        description: "URL da imagem de capa. Opcional.",
      },
      sourceUrl: {
        type: "string",
        description:
          "URL da matéria original. Precisa ser uma URL válida — vira o crédito no rodapé do post.",
      },
      sourceName: {
        type: "string",
        description: "Nome do veículo/fonte (ex.: 'Automotive Business'). Opcional.",
      },
      categorySlug: {
        type: "string",
        description:
          "Slug de uma categoria já existente no CMS. Se o slug não existir, a matéria entra sem " +
          "categoria — nenhuma categoria nova é criada.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Palavras-chave da matéria. Opcional.",
      },
    },
    required: ["title", "content"],
    additionalProperties: false,
  },
};

export async function runPublicarNoticia(
  creds: Credentials,
  args: unknown,
): Promise<IngestaoResponse> {
  const a = objeto(args);
  return apiRequest<IngestaoResponse>(creds, "/noticias/ingestao", {
    method: "POST",
    auth: "servico",
    body: {
      title: textoObrigatorio(a, "title", { min: 5, max: 200 }),
      content: textoObrigatorio(a, "content", { min: 50 }),
      excerpt: textoOpcional(a, "excerpt", { max: 400 }),
      coverUrl: textoOpcional(a, "coverUrl"),
      sourceUrl: textoOpcional(a, "sourceUrl", {
        formato: { regex: /^https?:\/\/\S+$/i, descricao: "uma URL http(s) completa" },
      }),
      sourceName: textoOpcional(a, "sourceName"),
      categorySlug: textoOpcional(a, "categorySlug"),
      tags: listaDeTextosOpcional(a, "tags"),
    },
  });
}
