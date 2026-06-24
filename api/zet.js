const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-20b:free";

function json(status, body) {
  return { status, body };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-10)
    .map((item) => ({
      role: item.role === "model" || item.role === "assistant" || item.role === "zet" ? "assistant" : "user",
      content: String(item.text || item.content || "").slice(0, 4000),
    }))
    .filter((item) => item.content.trim());
}

function buildSystemPrompt(body) {
  const pageText = body?.pageContext?.text || body?.pageContext?.title || "";
  const projectContext = [
    "Voce e o ZET, assistente de IA da ZOOM Education for Life.",
    "Responda em portugues do Brasil, com tom claro, direto, analitico e acolhedor.",
    "Voce ajuda a interpretar o dashboard da Rede Marista, Resultados de Atendimento 2026.",
    "Use apenas dados enviados pela pagina ou pelo usuario. Quando faltar dado, diga o que da para inferir e o que precisa ser conferido.",
    "Ao comparar meses, escolas ou acoes, destaque possiveis causas e proximas perguntas uteis.",
    "Use markdown leve para deixar a leitura mais viva: destaque termos importantes com **negrito**, nuances com *italico* e listas curtas com '- ' quando houver 2 ou mais pontos.",
    "Use de 1 a 3 emojis por resposta quando eles ajudarem a sinalizar ideia, alerta, celebracao ou investigacao. Nao exagere.",
    "Nao descreva acoes ou emocoes em formato de roleplay, como *sorri* ou *pensando*. Use italico apenas para enfatizar palavras ou ideias.",
    "Evite blocos longos. Prefira frases curtas, com uma abertura simpática e um fechamento que convide a explorar o dado.",
  ].join(" ");

  return [
    projectContext,
    body?.lessonTitle ? `Titulo do contexto: ${body.lessonTitle}` : "",
    body?.lessonKey ? `Chave da pagina: ${body.lessonKey}` : "",
    pageText ? `Conteudo visivel no dashboard:\n${String(pageText).slice(0, 18000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getProviders() {
  const providers = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      extraHeaders: {},
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
      extraHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "https://rede-marista-dashboard.vercel.app",
        "X-Title": "Rede Marista Dashboard",
      },
    });
  }

  return providers;
}

async function callChatCompletion(provider, body) {
  const messages = [
    { role: "system", content: buildSystemPrompt(body) },
    ...normalizeHistory(body.history),
    { role: "user", content: String(body.message || "").slice(0, 8000) },
  ];

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...provider.extraHeaders,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.55,
      max_tokens: 700,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || data?.message || response.statusText;
    throw new Error(`${provider.name} ${response.status}: ${detail}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${provider.name}: resposta vazia`);

  return text;
}

function send(res, status, body = null) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (body === null) return res.status(status).end();
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return send(res, 204);
  }

  if (req.method !== "POST") {
    const result = json(405, { error: "Metodo nao permitido" });
    return send(res, result.status, result.body);
  }

  const providers = getProviders();
  if (!providers.length) {
    const result = json(503, {
      error: "ZET sem chave de IA configurada. Configure GROQ_API_KEY ou OPENROUTER_API_KEY no ambiente.",
    });
    return send(res, result.status, result.body);
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body?.message) {
      const result = json(400, { error: "Mensagem ausente" });
      return send(res, result.status, result.body);
    }

    let lastError;
    let provider;
    let text;

    for (const candidate of providers) {
      try {
        text = await callChatCompletion(candidate, body);
        provider = candidate;
        break;
      } catch (error) {
        lastError = error;
        console.error("[ZET API]", error);
      }
    }

    if (!text || !provider) throw lastError || new Error("Nenhum provedor respondeu");

    const result = json(200, {
      text,
      provider: provider.name,
      model: provider.model,
    });
    return send(res, result.status, result.body);
  } catch (error) {
    console.error("[ZET API]", error);
    const result = json(500, { error: "Falha ao consultar o assistente." });
    return send(res, result.status, result.body);
  }
}
