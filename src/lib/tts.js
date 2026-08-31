/**
 * tts.js — Text-to-Speech helper using the Web Speech API.
 *
 * speakText(text, langCode) reads `text` aloud using a native voice
 * that matches `langCode` (e.g. "ja-JP", "en-US", "bn-BD").
 */

const LANG_VOICE_MAP = {
  ja: "ja-JP",
  en: "en-US",
  bn: "bn-BD",
};

let voicesLoaded = false;

function ensureVoices() {
  if (voicesLoaded) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
    voicesLoaded = true;
  };
  voicesLoaded = true;
}

export function speakText(text, langCode) {
  if (!text?.trim()) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  ensureVoices();

  const synth = window.speechSynthesis;
  synth.cancel();

  const resolvedLang = LANG_VOICE_MAP[langCode] || langCode;
  const voices = synth.getVoices();

  const voice =
    voices.find((v) => v.lang === resolvedLang) ||
    voices.find((v) => v.lang.startsWith(resolvedLang.split("-")[0])) ||
    null;

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = resolvedLang;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  synth.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
