const API_URL = import.meta.env.VITE_API_URL || "";
const USE_MOCK = false;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Mock knowledge base (same as before for demo mode) ----
const PHRASES = [
  { ja: "こんにちは", bn: "নমস্কার / হ্যালো", en: "Hello" },
  { ja: "おはよう", bn: "সুপ্রভাত", en: "Good morning" },
  { ja: "おはようございます", bn: "সুপ্রভাত (ভদ্র রূপ)", en: "Good morning (polite)" },
  { ja: "こんばんは", bn: "শুভ সন্ধ্যা", en: "Good evening" },
  { ja: "ありがとう", bn: "ধন্যবাদ", en: "Thank you" },
  { ja: "ありがとうございます", bn: "অনেক ধন্যবাদ", en: "Thank you very much" },
  { ja: "げんきですか", bn: "তুমি কেমন আছো?", en: "How are you?" },
  { ja: "げんきです", bn: "আমি ভালো আছি", en: "I'm doing well" },
  { ja: "はい", bn: "হ্যাঁ", en: "Yes" },
  { ja: "いいえ", bn: "না", en: "No" },
  { ja: "だいじょうぶ", bn: "ঠিক আছে / সমস্যা নেই", en: "It's okay" },
  { ja: "ごめんなさい", bn: "আমি দুঃখিত", en: "I'm sorry" },
  { ja: "また あした", bn: "আবার কাল দেখা হবে", en: "See you tomorrow" },
  { ja: "たのしみ", bn: "আমি অপেক্ষায় আছি", en: "Looking forward to it" },
  { ja: "おなかすいた", bn: "আমার খিদে পেয়েছে", en: "I'm hungry" },
  { ja: "いこう", bn: "চলো যাই", en: "Let's go" },
];

const BN_TO_JA = [
  { bn: "ধন্যবাদ", ja: "ありがとう" },
  { bn: "হ্যালো", ja: "こんにちは" },
  { bn: "নমস্কার", ja: "こんにちは" },
  { bn: "শুভ সন্ধ্যা", ja: "こんばんは" },
  { bn: "কেমন আছো", ja: "げんきですか" },
  { bn: "ভালো আছি", ja: "げんきです" },
  { bn: "দুঃখিত", ja: "ごめんなさい" },
  { bn: "চলো যাই", ja: "いこう" },
  { bn: "অপেক্ষায় আছি", ja: "たのしみ" },
];

function bestMatch(text, list, key) {
  const t = text.trim();
  let hit = list.find((p) => p[key] === t);
  if (hit) return hit;
  hit = list.find((p) => t.includes(p[key]) || p[key].includes(t));
  return hit || null;
}

function mockTranslate({ text, sourceLang, targetLang }) {
  const clean = text.trim();
  if (!clean) return { translation: "", has_correction: false, corrected_text: "", tips: [] };

  let translation = "";
  const tips = [];
  let corrected = clean;
  let hasCorrection = false;

  if (sourceLang === "ja") {
    const m = bestMatch(clean, PHRASES, "ja");
    translation = m ? (targetLang === "en" ? m.en : m.bn) : "...";
    if (/ありがとう$/.test(clean)) {
      hasCorrection = true;
      corrected = clean + "ございます";
      tips.push("Add ございます to sound more polite.");
    }
  } else if (sourceLang === "bn") {
    const m = bestMatch(clean, BN_TO_JA, "bn");
    translation = m ? m.ja : "...";
    if (m) {
      const p = PHRASES.find((x) => x.ja === m.ja);
      if (p) tips.push(`Reads as "${p.en}" in Japanese.`);
    }
  } else {
    translation = clean;
  }

  return { translation, has_correction: hasCorrection, corrected_text: corrected, tips, source_language: sourceLang, target_language: targetLang };
}

// ---- Public API ----

/**
 * Live typing feedback. In production: POST /api/translate/live (Vercel serverless).
 */
export async function livePreview({ text, sourceLang, targetLang, signal }) {
  if (USE_MOCK) {
    await delay(280 + Math.random() * 260);
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    return mockTranslate({ text, sourceLang, targetLang });
  }
  const res = await fetch(`${API_URL}/api/translate/live`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
    signal,
  });
  if (!res.ok) throw new Error(`live translate failed: ${res.status}`);
  return res.json();
}

/**
 * Translate a stored message on demand.
 */
export async function translateMessage({ text, sourceLang, targetLang }) {
  if (USE_MOCK) {
    await delay(360 + Math.random() * 240);
    const r = mockTranslate({ text, sourceLang, targetLang });
    return { translation: r.translation };
  }
  const res = await fetch(`${API_URL}/api/translate/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  if (!res.ok) throw new Error(`message translate failed: ${res.status}`);
  return res.json();
}
