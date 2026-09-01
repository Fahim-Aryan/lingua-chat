const MYMEMORY_API = "https://api.mymemory.translated.net/get";

const LANG_MAP = {
  ja: "ja",
  bn: "bn",
  en: "en",
};

/** Detect the real language of a text via Unicode blocks (ja / bn / en). */
function detectLang(str) {
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(str)) return "ja";
  if (/[\u0980-\u09ff]/.test(str)) return "bn";
  return "en";
}

/**
 * The stored source_language is not always trustworthy (e.g. the sender applied
 * a live translation into the composer or typed in another language), so we
 * trust the text content when it clearly contradicts the stored value.
 */
function resolveSourceLang(text, claimed) {
  const detected = detectLang(text);
  if (detected !== claimed && LANG_MAP[detected]) return detected;
  return claimed;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildLangPair(sourceLang, targetLang) {
  const src = LANG_MAP[sourceLang] || sourceLang;
  const tgt = LANG_MAP[targetLang] || targetLang;
  return `${src}|${tgt}`;
}

async function myMemoryTranslate(text, sourceLang, targetLang, signal) {
  // Never ask the API for X -> X (it errors: "please select two distinct languages").
  if (sourceLang === targetLang) return text;

  const langpair = buildLangPair(sourceLang, targetLang);
  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  if (!data.responseData?.translatedText) throw new Error("No translation");
  return data.responseData.translatedText;
}

export async function livePreview({ text, sourceLang, targetLang, signal }) {
  if (!text.trim()) return { translation: "", has_correction: false, corrected_text: "", tips: [], source_language: sourceLang, target_language: targetLang };

  const src = resolveSourceLang(text, sourceLang);
  const translation = await myMemoryTranslate(text, src, targetLang, signal);
  return {
    translation,
    has_correction: false,
    corrected_text: text,
    tips: [],
    source_language: src,
    target_language: targetLang,
  };
}

export async function translateMessage({ text, sourceLang, targetLang }) {
  if (!text.trim()) return { translation: "" };
  const src = resolveSourceLang(text, sourceLang);
  const translation = await myMemoryTranslate(text, src, targetLang);
  return { translation };
}
