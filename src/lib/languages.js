/**
 * languages.js — language metadata used across the app.
 * Codes match what the PRD stores in source_language / target_language.
 */

export const LANGUAGES = {
  bn: { code: "bn", label: "Bangla", native: "বাংলা", flag: "🇧🇩", font: "font-bn", dir: "ltr" },
  ja: { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵", font: "font-jp", dir: "ltr" },
  en: { code: "en", label: "English", native: "English", flag: "🇬🇧", font: "", dir: "ltr" },
};

export const LANGUAGE_ORDER = ["bn", "ja", "en"];

export function otherLang(code) {
  if (code === "ja") return "bn";
  if (code === "bn") return "ja";
  return "ja";
}

export function getTargetLang(sourceLang, settings) {
  return settings?.targetLang || otherLang(sourceLang);
}
