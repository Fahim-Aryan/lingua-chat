import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------- providers
// AI_PROVIDER = "nvidia" (default) | "gemini"
// NVIDIA / OpenAI-compatible: any base URL + model name works
// (build.nvidia.com, OpenRouter, Together, Azure OpenAI, local vLLM...)
const PROVIDER = process.env.AI_PROVIDER || "nvidia";

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
// Primary model — best translation quality available on the free tier
// (gpt-oss-20b is a small reasoning model: ~3s, very accurate multilingual)
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-20b";
// Fallback model — fast & always up; used when the primary times out/errors
const NVIDIA_FALLBACK_MODEL = process.env.NVIDIA_FALLBACK_MODEL || "meta/llama-3.1-8b-instruct";
const REQUEST_TIMEOUT_MS = 25000;

const genAI = PROVIDER === "gemini"
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const MAX_TEXT_LEN = 500;

const PROMPT = `You are a translation and language-coaching engine inside a chat app.
Your ONLY job: given the user's text, return a strict JSON object.

Rules:
- Translate the text from sourceLang to targetLang. If the text is already
  complete, give the best natural translation. If it is an unfinished fragment
  (user is still typing), give the closest partial translation.
- Check the text for grammar mistakes and awkward word choice in the SOURCE language.
  If you find an improvement, set has_correction true, put the corrected full text
  in corrected_text, and add 1 short tip (max 12 words) explaining why.
- If the text is already good, has_correction is false and corrected_text equals the input.
- tips: array of 0-2 very short strings. Empty if nothing useful to say.
- Never add anything outside the JSON.

Respond ONLY with JSON, no markdown, no commentary:
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

// --- NVIDIA / OpenAI-compatible chat completions (native fetch, no deps) ---
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
      max_tokens: 900,
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

// Primary model first, fallback model on error/timeout
async function askNvidia(text, sourceLang, targetLang) {
  try {
    return await askNvidiaModel(NVIDIA_MODEL, text, sourceLang, targetLang);
  } catch (err) {
    console.warn(`[nvidia] primary "${NVIDIA_MODEL}" failed (${err.message}) — trying fallback`);
    return await askNvidiaModel(NVIDIA_FALLBACK_MODEL, text, sourceLang, targetLang);
  }
}

// --- Gemini (optional fallback provider) ---
async function askGemini(text, sourceLang, targetLang) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `${PROMPT}\n\nNow translate: "${text}" ${sourceLang}->${targetLang}` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
  });
  return cleanJson(result.response.text());
}

function translate(text, sourceLang, targetLang) {
  if (PROVIDER === "gemini") return askGemini(text, sourceLang, targetLang);
  return askNvidia(text, sourceLang, targetLang);
}

function validate(body) {
  const { text, sourceLang, targetLang } = body || {};
  if (typeof text !== "string" || !text.trim()) {
    return { error: "text is required" };
  }
  if (text.length > MAX_TEXT_LEN) {
    return { error: `text too long (max ${MAX_TEXT_LEN} chars)` };
  }
  if (!sourceLang || !targetLang) {
    return { error: "sourceLang and targetLang are required" };
  }
  return { text, sourceLang, targetLang };
}

// POST /api/translate/live — live typing preview
app.post("/api/translate/live", async (req, res) => {
  const ok = validate(req.body);
  if (ok.error) return res.status(400).json({ error: ok.error });
  try {
    const data = await translate(ok.text, ok.sourceLang, ok.targetLang);
    res.json(data);
  } catch (err) {
    console.error("[live]", err.message);
    res.status(500).json({ error: "translation failed" });
  }
});

// POST /api/translate/message — translate a stored message
app.post("/api/translate/message", async (req, res) => {
  const ok = validate(req.body);
  if (ok.error) return res.status(400).json({ error: ok.error });
  try {
    const data = await translate(ok.text, ok.sourceLang, ok.targetLang);
    res.json({ translation: data.translation });
  } catch (err) {
    console.error("[message]", err.message);
    res.status(500).json({ error: "translation failed" });
  }
});

app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    provider: PROVIDER,
    model: PROVIDER === "gemini" ? GEMINI_MODEL : `${NVIDIA_MODEL} → ${NVIDIA_FALLBACK_MODEL}`,
  })
);

app.listen(PORT, () => {
  console.log(`Lingua server running on http://localhost:${PORT}`);
  console.log(
    `AI provider: ${PROVIDER} (${
      PROVIDER === "gemini" ? GEMINI_MODEL : `${NVIDIA_MODEL} → fallback ${NVIDIA_FALLBACK_MODEL}`
    })`
  );
});