const MYMEMORY_API = "https://api.mymemory.translated.net/get";

const LANG_MAP = {
  ja: "ja",
  bn: "bn",
  en: "en",
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildLangPair(sourceLang, targetLang) {
  const src = LANG_MAP[sourceLang] || sourceLang;
  const tgt = LANG_MAP[targetLang] || targetLang;
  return `${src}|${tgt}`;
}

async function myMemoryTranslate(text, sourceLang, targetLang, signal) {
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

  const translation = await myMemoryTranslate(text, sourceLang, targetLang, signal);
  return {
    translation,
    has_correction: false,
    corrected_text: text,
    tips: [],
    source_language: sourceLang,
    target_language: targetLang,
  };
}

export async function translateMessage({ text, sourceLang, targetLang }) {
  if (!text.trim()) return { translation: "" };
  const translation = await myMemoryTranslate(text, sourceLang, targetLang);
  return { translation };
}
