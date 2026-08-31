import { useState } from "react";
import { motion } from "framer-motion";
import { Languages, CheckCheck, Sparkle, Volume } from "./icons";
import { translateMessage } from "../lib/translation";
import { speakText } from "../lib/tts";
import { getMe } from "../lib/store";
import { formatTime, cx, isJapanese } from "../lib/utils";

export default function MessageBubble({ msg, autoTranslate, isNew }) {
  const me = getMe();
  const mine = msg.sender_id === me.user_id;

  const [translation, setTranslation] = useState(
    autoTranslate ? msg.translated_text : null
  );
  const [loading, setLoading] = useState(false);

  const hasTranslation = translation || msg.translated_text;
  const canTranslate = !hasTranslation && msg.original_text;

  async function handleTranslate() {
    if (translation || loading) return;
    if (msg.translated_text) {
      setTranslation(msg.translated_text);
      return;
    }
    setLoading(true);
    try {
      const { translation: tr } = await translateMessage({
        text: msg.original_text,
        sourceLang: msg.source_language,
        targetLang: msg.target_language,
      });
      setTranslation(tr);
    } finally {
      setLoading(false);
    }
  }

  const shown = translation || msg.translated_text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cx("flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div className={cx("max-w-[78%] sm:max-w-[68%]")}>
        <div
          className={cx(
            "relative px-4 py-2.5 transition-all duration-500",
            mine
              ? "rounded-[20px] rounded-br-md bg-outgoing text-outgoing-ink"
              : "rounded-[20px] rounded-bl-md bg-surface text-ink shadow-xs ring-1 ring-line",
            isNew && !mine && "ring-2 ring-brand/40 bg-brand-soft/30 shadow-md msg-highlight"
          )}
        >
          {msg.media_url && (
            <img
              src={msg.media_url}
              alt="Shared media"
              loading="lazy"
              className="mb-2 max-h-64 w-full rounded-xl object-cover"
            />
          )}

          {msg.original_text && (
            <p
              className={cx(
                "whitespace-pre-wrap break-words text-[15px] leading-relaxed",
                isJapanese(msg.original_text) && "font-jp",
                msg.source_language === "bn" && "font-bn"
              )}
            >
              {msg.original_text}
            </p>
          )}

          {shown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cx(
                "mt-2 overflow-hidden border-t pt-2 text-[13.5px] leading-relaxed font-bn",
                mine ? "border-white/20 text-white/85" : "border-line text-muted"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cx(
                    "flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider",
                    mine ? "text-white/60" : "text-accent"
                  )}
                >
                  <Sparkle size={11} /> translation
                </span>
                <button
                  onClick={() => speakText(shown, msg.target_language)}
                  className={cx(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-200",
                    mine
                      ? "text-white/60 hover:bg-white/10 hover:text-white/90"
                      : "text-faint hover:bg-surface-2 hover:text-ink"
                  )}
                  aria-label="Listen to pronunciation"
                  title="Listen to pronunciation"
                >
                  <Volume size={13} />
                </button>
              </div>
              {shown}
            </motion.div>
          )}

          <div
            className={cx(
              "mt-1 flex items-center justify-end gap-1 text-[10.5px]",
              mine ? "text-white/60" : "text-faint"
            )}
          >
            {formatTime(msg.created_at)}
            {mine && <CheckCheck size={14} />}
          </div>
        </div>

        {canTranslate && (
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-brand transition-all duration-200 hover:bg-brand-soft hover:shadow-xs disabled:opacity-50"
          >
            <Languages size={13} />
            {loading ? "Translating..." : "Translate"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
