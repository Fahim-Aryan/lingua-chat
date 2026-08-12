import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkle, Send, Languages } from "./icons";
import { supabase, isConfigured } from "../lib/supabase";

export default function Login({ onEnter }) {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!isConfigured) { onEnter(); return; }
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username || email.split("@")[0], preferred_language: "bn" } },
        });
        if (error) throw error;
        if (!data.session) { setError("Check your email to confirm, then sign in."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onEnter();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-full w-full lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl" style={{ background: "oklch(0.58 0.14 162 / 0.25)" }} />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full blur-3xl" style={{ background: "oklch(0.72 0.14 55 / 0.2)" }} />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Sparkle size={20} className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">Lingua</span>
          </div>

          <div className="max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Bengali ↔ Japanese
            </p>
            <h1 className="mt-4 text-[2.8rem] font-extrabold leading-[1.05] tracking-tight text-white balance">
              Every message,
              <br />understood both ways.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60 pretty">
              A chat that translates as you type and checks your grammar before
              you send. Speak your mind — in a language you're still learning.
            </p>

            <div className="mt-10 flex flex-col gap-3">
              <ChatTeaser mine text="Konbanwa, genki desu ka?" tr="Shubho shondhya, tumi kemon acho?" />
              <ChatTeaser text="Genki desu! Tanoshimi" tr="Bhalo achi! Opekkhay achi" />
            </div>
          </div>

          <p className="text-[12px] text-white/30">React · Node · Supabase · NVIDIA</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
              <Sparkle size={22} />
            </div>
          </div>

          <h2 className="text-[22px] font-extrabold tracking-tight text-ink">
            {mode === "in" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-[14px] text-muted">
            {mode === "in"
              ? "Sign in to pick up your conversations."
              : "Start chatting across languages in a minute."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "up" && (
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Username</span>
                <input className="input-field" placeholder="ayan" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" autoComplete="email" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" autoComplete={mode === "in" ? "current-password" : "new-password"} required />
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600 ring-1 ring-red-100" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3 text-[14.5px]"
            >
              {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
              <Send size={17} />
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-muted">
            {mode === "in" ? "New here?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-semibold text-brand hover:text-brand-hover">
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <div className="mt-8 flex items-center justify-center gap-1.5 rounded-full bg-surface-2 px-3 py-2 text-[11.5px] text-muted">
            <Languages size={13} className="text-brand" />
            {isConfigured ? "Protected by Supabase Auth" : "Demo — any credentials open the app"}
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: var(--radius-xl);
          border: 1px solid var(--line);
          background: var(--surface-2);
          padding: 0.7rem 1rem;
          font-size: 14.5px;
          color: var(--ink);
          transition: all 0.2s;
        }
        .input-field::placeholder { color: var(--faint); }
        .input-field:focus {
          outline: none;
          background: var(--surface);
          border-color: var(--brand);
          box-shadow: 0 0 0 3px var(--brand-glow);
        }
      `}</style>
    </div>
  );
}

function ChatTeaser({ mine, text, tr }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: mine ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: mine ? 0.2 : 0.4 }}
      className={mine ? "self-end text-right" : "self-start"}
    >
      <div className={`inline-block rounded-2xl px-4 py-2.5 text-left text-[13.5px] ${mine ? "rounded-br-md bg-white/10 ring-1 ring-white/10" : "rounded-bl-md bg-white/[0.06] ring-1 ring-white/[0.08]"}`}>
        <p className="text-white/90">{text}</p>
        <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[12px] text-accent">
          {tr}
        </p>
      </div>
    </motion.div>
  );
}
