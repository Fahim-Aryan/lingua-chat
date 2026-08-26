import { useState } from "react";
import { motion } from "framer-motion";
import { Languages, CheckCheck, Sparkle } from "./icons";
import { translateMessage } from "../lib/translation";
import { getMe } from "../lib/store";
import { formatTime, cx, isJapanese } from "../lib/utils";

export default function MessageBubble({ msg, autoTranslate }) {
  const me = getMe();
  const mine = msg.sender_id === me.user_id;
  const foreign = !mine && isJapanese(msg.original_text);

  const [translation, setTranslation] = useState(
    autoTranslate ? msg.translated_text : null
  );
  const [loading, setLoading] = useState(false);

  const canTranslate = foreign && !translation;

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

  const shown = autoTranslate && !translation && msg.translated_text
    ? msg.translated_text
    : translation;

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
            "relative px-4 py-2.5",
            mine
              ? "rounded-[20px] rounded-br-md bg-outgoing text-outgoing-ink"
              : "rounded-[20px] rounded-bl-md bg-surface text-ink shadow-xs ring-1 ring-line"
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
                isJapanese(msg.original_text) && "font-jp"
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
              <span
                className={cx(
                  "mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider",
                  mine ? "text-white/60" : "text-accent"
                )}
              >
                <Sparkle size={11} /> translation
              </span>
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
