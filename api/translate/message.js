import { GoogleGenerativeAI } from "@google/generative-ai";

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-20b";
const NVIDIA_FALLBACK_MODEL = process.env.NVIDIA_FALLBACK_MODEL || "meta/llama-3.1-8b-instruct";
const REQUEST_TIMEOUT_MS = 25000;

const PROMPT = `You are a translation engine. Translate the user text from sourceLang to targetLang.
Return ONLY a JSON object with this schema: {"translation": string, "source_language": string, "target_language": string}
No markdown, no commentary.`;

function cleanJson(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("model did not return JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

async function askNvidiaModel(model, text, sourceLang, targetLang) {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: `${PROMPT}\n\nsourceLang: ${sourceLang}\ntargetLang: ${targetLang}\ntext: "${text}"`,
        },
      ],
      temperature: 0.2,
      max_tokens: 512,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NVIDIA API ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  return cleanJson(json.choices?.[0]?.message?.content || "");
}

async function askNvidia(text, sourceLang, targetLang) {
  try {
    return await askNvidiaModel(NVIDIA_MODEL, text, sourceLang, targetLang);
  } catch (err) {
    console.warn(`[nvidia] primary failed: ${err.message} — trying fallback`);
    return await askNvidiaModel(NVIDIA_FALLBACK_MODEL, text, sourceLang, targetLang);
  }
}

async function askGemini(text, sourceLang, targetLang) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `${PROMPT}\n\nTranslate: "${text}" ${sourceLang}->${targetLang}` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
  });
  return cleanJson(result.response.text());
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, sourceLang, targetLang } = req.body || {};
  if (!text?.trim() || !sourceLang || !targetLang) {
    return res.status(400).json({ error: "text, sourceLang, targetLang required" });
  }

  try {
    const data = process.env.AI_PROVIDER === "gemini"
      ? await askGemini(text, sourceLang, targetLang)
      : await askNvidia(text, sourceLang, targetLang);
    res.status(200).json({ translation: data.translation });
  } catch (err) {
    console.error("[translate/message]", err.message);
    res.status(500).json({ error: "translation failed" });
  }
}
