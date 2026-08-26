import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Sun, Moon, ArrowRightLeft, Check, Languages } from "./icons";
import { LANGUAGES, LANGUAGE_ORDER } from "../lib/languages";
import { cx } from "../lib/utils";

const THEMES = ["light", "dark"];
const THEME_LABELS = { light: "Light", dark: "Dark" };

export default function Settings({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState({ ...settings });

  if (!open) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-surface shadow-float ring-1 ring-line"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-[17px] font-extrabold text-ink">Settings</h2>
              <button onClick={onClose} className="btn-ghost h-9 w-9" aria-label="Close settings">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
              {/* Profile */}
              <section>
                <SectionTitle icon={<User size={15} />} title="Profile" />
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-muted">Username</span>
                    <input
                      className="input-field"
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      placeholder="Your name"
                    />
                  </label>
                </div>
              </section>

              {/* Language Pair */}
              <section>
                <SectionTitle icon={<Languages size={15} />} title="Translate From" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LANGUAGE_ORDER.map((code) => {
                    const lang = LANGUAGES[code];
                    const active = form.sourceLang === code;
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          update("sourceLang", code);
                          const others = LANGUAGE_ORDER.filter((c) => c !== code);
                          if (others.includes(form.targetLang)) return;
                          update("targetLang", others[0]);
                        }}
                        className={cx(
                          "flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[13px] font-semibold ring-1 transition-all duration-200",
                          active
                            ? "bg-brand-soft text-brand-ink ring-brand/20 shadow-xs"
                            : "bg-surface-2 text-muted ring-line hover:text-ink"
                        )}
                      >
                        <span className="text-[18px]">{lang.flag}</span>
                        <span>{lang.native}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionTitle icon={<ArrowRightLeft size={15} />} title="Translate To" />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LANGUAGE_ORDER.filter((c) => c !== form.sourceLang).map((code) => {
                    const lang = LANGUAGES[code];
                    const active = form.targetLang === code;
                    return (
                      <button
                        key={code}
                        onClick={() => update("targetLang", code)}
                        className={cx(
                          "flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-[13px] font-semibold ring-1 transition-all duration-200",
                          active
                            ? "bg-brand-soft text-brand-ink ring-brand/20 shadow-xs"
                            : "bg-surface-2 text-muted ring-line hover:text-ink"
                        )}
                      >
                        <span className="text-[18px]">{lang.flag}</span>
                        <span>{lang.native}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Theme */}
              <section>
                <SectionTitle icon={form.theme === "dark" ? <Moon size={15} /> : <Sun size={15} />} title="Appearance" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {THEMES.map((t) => {
                    const active = form.theme === t;
                    return (
                      <button
                        key={t}
                        onClick={() => update("theme", t)}
                        className={cx(
                          "flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold ring-1 transition-all duration-200",
                          active
                            ? "bg-brand-soft text-brand-ink ring-brand/20 shadow-xs"
                            : "bg-surface-2 text-muted ring-line hover:text-ink"
                        )}
                      >
                        {t === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                        {THEME_LABELS[t]}
                        {active && <Check size={14} className="ml-auto text-brand" />}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Auto-translate */}
              <section>
                <SectionTitle icon={<Languages size={15} />} title="Auto-translate incoming" />
                <div className="mt-3">
                  <button
                    onClick={() => update("autoTranslate", !form.autoTranslate)}
                    className={cx(
                      "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200",
                      form.autoTranslate ? "bg-brand" : "bg-line-strong"
                    )}
                  >
                    <span
                      className={cx(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                        form.autoTranslate ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className="ml-3 text-[13px] text-muted">
                    {form.autoTranslate ? "ON — incoming messages auto-translated" : "OFF — tap Translate manually"}
                  </span>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-line px-6 py-4">
              <button onClick={handleSave} className="btn-primary w-full py-3 text-[14px]">
                Save settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted">
      <span className="text-faint">{icon}</span>
      {title}
    </h3>
  );
}
