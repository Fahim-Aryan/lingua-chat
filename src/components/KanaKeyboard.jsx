import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Backspace } from "./icons";
import { KANA_ROWS } from "../lib/kana";
import { cx } from "../lib/utils";

export default function KanaKeyboard({ open, onKey, onBackspace, onSpace, onEnter, onClose }) {
  const [mode, setMode] = useState("hiragana");
  const rows = KANA_ROWS[mode];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 bottom-0 z-[55] border-t border-line bg-surface/95 backdrop-blur-xl safe-bottom"
        >
          <div className="mx-auto max-w-3xl px-3 py-3">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="inline-flex rounded-xl bg-surface-2 p-0.5 ring-1 ring-line">
                {["hiragana", "katakana"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cx(
                      "rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                      mode === m ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink"
                    )}
                  >
                    {m === "hiragana" ? "A Ka" : "A Ka"}
                  </button>
                ))}
              </div>
              <button className="btn-ghost h-8 w-8" onClick={onClose} aria-label="Close keyboard">
                <X size={17} />
              </button>
            </div>

            <div className="space-y-1.5">
              {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-5 gap-1.5">
                  {row.map((k) => (
                    <button
                      key={k}
                      onClick={() => onKey(k)}
                      className="font-jp rounded-xl bg-surface py-2.5 text-[17px] text-ink shadow-xs ring-1 ring-line transition-all duration-150 hover:bg-surface-2 hover:shadow-sm active:scale-95"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ))}

              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                <button
                  onClick={onSpace}
                  className="col-span-3 rounded-xl bg-surface py-2.5 text-[12.5px] font-medium text-muted shadow-xs ring-1 ring-line transition-all duration-150 hover:bg-surface-2 hover:shadow-sm active:scale-[0.98]"
                >
                  space
                </button>
                <button
                  onClick={onBackspace}
                  className="grid place-items-center rounded-xl bg-surface py-2.5 text-muted shadow-xs ring-1 ring-line transition-all duration-150 hover:bg-surface-2 hover:shadow-sm active:scale-95"
                  aria-label="Backspace"
                >
                  <Backspace size={19} />
                </button>
                <button
                  onClick={onEnter}
                  className="rounded-xl bg-brand py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:scale-95"
                >
                  send
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
