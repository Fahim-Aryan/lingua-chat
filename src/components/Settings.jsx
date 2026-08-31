import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Sun, Moon, Check, Languages, Camera } from "./icons";
import { LANGUAGES, LANGUAGE_ORDER } from "../lib/languages";
import { cx } from "../lib/utils";

const THEMES = ["light", "dark"];
const THEME_LABELS = { light: "Light", dark: "Dark" };

export default function Settings({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) setForm({ ...settings });
  }, [open]);

  if (!open) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("profile_picture", reader.result);
    reader.readAsDataURL(file);
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
                <div className="mt-3 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div
                        className={cx(
                          "flex h-20 w-20 items-center justify-center rounded-full ring-2 ring-line overflow-hidden",
                          form.profile_picture ? "" : "bg-brand-soft"
                        )}
                      >
                        {form.profile_picture ? (
                          <img src={form.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User size={32} className="text-brand" />
                        )}
                      </div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-sm ring-2 ring-surface hover:bg-brand-hover"
                        aria-label="Change profile picture"
                      >
                        <Camera size={13} />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatar}
                      />
                    </div>
                    <div className="text-[12.5px] text-muted">
                      <p className="font-medium text-ink">Profile picture</p>
                      <p>Click camera icon to change</p>
                    </div>
                  </div>

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

              {/* My Language */}
              <section>
                <SectionTitle icon={<Languages size={15} />} title="I speak" />
                <p className="mt-1.5 text-[12.5px] text-muted">Messages from your contacts will be translated to this language.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LANGUAGE_ORDER.map((code) => {
                    const lang = LANGUAGES[code];
                    const active = form.sourceLang === code;
                    return (
                      <button
                        key={code}
                        onClick={() => update("sourceLang", code)}
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
