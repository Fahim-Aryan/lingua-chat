import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, X, Info, Check } from "./icons";
import { LANGUAGES } from "../lib/languages";
import { cx } from "../lib/utils";

export default function LivePreview({ state, sourceLang, targetLang, onApplyCorrection, onDismiss }) {
  const open = state.status !== "idle";
  const src = LANGUAGES[sourceLang];
  const tgt = LANGUAGES[targetLang];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto relative overflow-hidden rounded-2xl bg-surface shadow-preview ring-1 ring-line"
          role="status"
          aria-live="polite"
        >
          {/* Accent hairline */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />

          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
              <Sparkle size={18} className="text-accent" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-accent">
                  live
                  <span className="text-faint normal-case tracking-normal">
                    {src.native} → {tgt.native}
                  </span>
                </span>
                <button
                  onClick={onDismiss}
                  className="btn-ghost h-7 w-7"
                  aria-label="Dismiss preview"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-2 min-h-[24px]">
                {state.status === "loading" ? (
                  <ShimmerLine />
                ) : state.status === "error" ? (
                  <p className="text-[13px] text-muted">
                    Couldn't reach the translator. Check your connection.
                  </p>
                ) : (
                  <p
                    className={cx(
                      "text-[15px] leading-snug text-ink",
                      targetLang === "bn" && "font-bn",
                      targetLang === "ja" && "font-jp"
                    )}
                  >
                    {state.data?.translation || (
                      <span className="text-faint">...</span>
                    )}
                  </p>
                )}
              </div>

              {state.data?.has_correction && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5"
                >
                  <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-brand-ink">
                    <Check size={12} /> better
                  </span>
                  <span className="font-jp text-[14px] text-brand-ink">
                    {state.data.corrected_text}
                  </span>
                  <button
                    onClick={() => onApplyCorrection(state.data.corrected_text)}
                    className="ml-auto rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-brand-hover active:scale-95"
                  >
                    Use this
                  </button>
                </motion.div>
              )}

              {state.data?.tips?.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                  {state.data.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[12.5px] leading-snug text-muted"
                    >
                      <Info size={13} className="mt-0.5 shrink-0 text-faint" />
                      <span className="pretty">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShimmerLine() {
  return (
    <div className="flex flex-col gap-2">
      <span className="relative h-4 w-3/4 overflow-hidden rounded-full bg-surface-2">
        <Sweep />
      </span>
      <span className="relative h-4 w-2/5 overflow-hidden rounded-full bg-surface-2">
        <Sweep />
      </span>
    </div>
  );
}

function Sweep() {
  return (
    <span
      className="absolute inset-0 -translate-x-full"
      style={{
        background: "linear-gradient(90deg, transparent, oklch(0.72 0.14 55 / 0.15), transparent)",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}
