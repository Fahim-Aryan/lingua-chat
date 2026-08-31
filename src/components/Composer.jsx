import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Paperclip, Keyboard, ArrowDownUp } from "./icons";
import LivePreview from "./LivePreview";
import KanaKeyboard from "./KanaKeyboard";
import { LANGUAGES, otherLang } from "../lib/languages";
import { livePreview } from "../lib/translation";
import { romajiToKana } from "../lib/kana";
import { cx } from "../lib/utils";

const DEBOUNCE_MS = 400;

export default function Composer({ inputLang, setInputLang, onSend, onAttach, targetLang: targetLangProp }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState({ status: "idle", data: null });
  const [kanaOpen, setKanaOpen] = useState(false);
  const [romajiOn, setRomajiOn] = useState(true);

  const textareaRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const romajiBuf = useRef("");

  const targetLang = useMemo(
    () => targetLangProp || (inputLang === "en" ? "bn" : otherLang(inputLang)),
    [inputLang, targetLangProp]
  );

  const requestPreview = useCallback(
    (value) => {
      clearTimeout(debounceRef.current);
      if (!value.trim()) {
        abortRef.current?.abort();
        setPreview({ status: "idle", data: null });
        return;
      }
      setPreview((p) => ({ status: "loading", data: p.data }));
      debounceRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const data = await livePreview({
            text: value,
            sourceLang: inputLang,
            targetLang,
            signal: controller.signal,
          });
          setPreview({ status: "ready", data });
        } catch (err) {
          if (err.name !== "AbortError") setPreview({ status: "error", data: null });
        }
      }, DEBOUNCE_MS);
    },
    [inputLang, targetLang]
  );

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (text.trim()) requestPreview(text);
  }, [inputLang]);

  function updateText(next) {
    setText(next);
    requestPreview(next);
    autosize();
  }

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleChange(e) {
    const raw = e.target.value;
    if (inputLang === "ja" && romajiOn) {
      if (raw.length > text.length && /[a-zA-Z]$/.test(raw)) {
        romajiBuf.current += raw.slice(text.length);
        const { kana, rest } = romajiToKana(romajiBuf.current);
        romajiBuf.current = rest;
        const base = raw.slice(0, text.length).replace(/[a-zA-Z]+$/, "");
        updateText(base + kana + rest);
        return;
      }
      romajiBuf.current = "";
    }
    updateText(raw);
  }

  function insertKana(ch) {
    romajiBuf.current = "";
    updateText(text + ch);
    textareaRef.current?.focus();
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend({ text: value, sourceLang: inputLang, targetLang });
    setText("");
    romajiBuf.current = "";
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setPreview({ status: "idle", data: null });
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function applyCorrection(corrected) {
    updateText(corrected);
    textareaRef.current?.focus();
  }

  function toggleInputLang() {
    const langs = ["ja", "bn", "en"];
    const idx = langs.indexOf(inputLang);
    setInputLang(langs[(idx + 1) % langs.length]);
  }

  const src = LANGUAGES[inputLang];
  const tgt = LANGUAGES[targetLang];

  return (
    <div className="relative">
      {/* Floating live preview */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full px-3 pb-3 sm:px-4">
        <div className="mx-auto max-w-3xl">
          <LivePreview
            state={preview}
            sourceLang={inputLang}
            targetLang={targetLang}
            onApplyCorrection={applyCorrection}
            onApplyTranslation={applyCorrection}
            onDismiss={() => setPreview({ status: "idle", data: null })}
          />
        </div>
      </div>

      <div className="border-t border-line bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-3 py-3 sm:px-4">
          {/* Language toggle bar */}
          <div className="mb-2.5 flex items-center justify-between">
            <button
              onClick={toggleInputLang}
              className="group inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-ink ring-1 ring-line transition-all duration-200 hover:bg-brand-soft hover:ring-brand/20 hover:shadow-xs"
              aria-label={`Typing in ${src.label}. Switch language.`}
            >
              <span className={src.font}>{src.native}</span>
              <ArrowDownUp size={13} className="text-brand" />
              <span className={cx("text-muted", tgt.font)}>{tgt.native}</span>
            </button>

            {inputLang === "ja" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRomajiOn((v) => !v)}
                  className={cx(
                    "rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 transition-all duration-200",
                    romajiOn
                      ? "bg-brand-soft text-brand-ink ring-brand/20 shadow-xs"
                      : "text-muted ring-line hover:text-ink"
                  )}
                  title="Type romaji, get kana"
                >
                  romaji → kana
                </button>
                <button
                  onClick={() => setKanaOpen((v) => !v)}
                  className={cx(
                    "btn-ghost h-8 w-8 ring-1",
                    kanaOpen ? "bg-brand-soft text-brand ring-brand/20 shadow-xs" : "ring-line"
                  )}
                  aria-label="Toggle Japanese keyboard"
                  aria-pressed={kanaOpen}
                >
                  <Keyboard size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Input row */}
          <div className="flex items-end gap-2">
            <button
              onClick={onAttach}
              className="btn-ghost mb-0.5 h-11 w-11 shrink-0 ring-1 ring-line"
              aria-label="Attach image or file"
            >
              <Paperclip size={19} />
            </button>

            <div className="flex flex-1 items-end rounded-2xl bg-surface-2 px-3.5 py-1 ring-1 ring-line transition-all duration-200 focus-within:bg-surface focus-within:shadow-sm focus-within:ring-brand/30">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  inputLang === "ja"
                    ? "Type in Japanese... (or romaji)"
                    : `Type in ${src.label}...`
                }
                className={cx(
                  "max-h-[120px] w-full resize-none bg-transparent py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-faint focus:outline-none",
                  src.font
                )}
                aria-label={`Message in ${src.label}`}
              />
            </div>

            <button
              onClick={send}
              disabled={!text.trim()}
              className={cx(
                "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200",
                text.trim()
                  ? "bg-brand shadow-sm hover:bg-brand-hover hover:shadow-md active:scale-95"
                  : "cursor-not-allowed bg-line-strong text-faint"
              )}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </div>
        </div>

        <KanaKeyboard
          open={kanaOpen}
          onKey={insertKana}
          onBackspace={() => updateText(text.slice(0, -1))}
          onSpace={() => updateText(text + "\u3000")}
          onEnter={send}
          onClose={() => setKanaOpen(false)}
        />
      </div>
    </div>
  );
}
