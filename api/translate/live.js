import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel serverless: NVIDIA API (OpenAI-compatible)
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-20b";
const NVIDIA_FALLBACK_MODEL = process.env.NVIDIA_FALLBACK_MODEL || "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 25000;

const PROMPT = `You are a translation and language-coaching engine inside a chat app.
Your ONLY job: given the user's text, return a strict JSON object.

Rules:
- Translate the text from sourceLang to targetLang.
- Check the text for grammar mistakes in the SOURCE language.
- If improvement found: has_correction true, corrected_text with fix, tips array with 1 short tip.
- If already good: has_correction false, corrected_text equals input.
- tips: 0-2 very short strings (max 12 words each).

Respond ONLY with JSON:
{
  "translation": string,
  "has_correction": boolean,
  "corrected_text": string,
  "tips": string[],
  "source_language": string,
  "target_language": string
}`;

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
          content: `${PROMPT}\n\nNow translate this text.\nsourceLang: ${sourceLang}\ntargetLang: ${targetLang}\ntext: "${text}"`,
        },
      ],
      temperature: 0.3,
      max_tokens: 16384,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NVIDIA API ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const msg = json.choices?.[0]?.message;
  const raw = msg?.content || msg?.reasoning_content || msg?.reasoning || "";
  return cleanJson(raw);
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
    contents: [{ role: "user", parts: [{ text: `${PROMPT}\n\nNow translate: "${text}" ${sourceLang}->${targetLang}` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 900 },
  });
  return cleanJson(result.response.text());
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, sourceLang, targetLang } = req.body || {};
  if (!text?.trim() || !sourceLang || !targetLang) {
    return res.status(400).json({ error: "text, sourceLang, targetLang required" });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: "text too long (max 500)" });
  }

  try {
    const data = process.env.AI_PROVIDER === "gemini"
      ? await askGemini(text, sourceLang, targetLang)
      : await askNvidia(text, sourceLang, targetLang);
    res.status(200).json(data);
  } catch (err) {
    console.error("[translate/live]", err.message);
    res.status(500).json({ error: "translation failed" });
  }
}
