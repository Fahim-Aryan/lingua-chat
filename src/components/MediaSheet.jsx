import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Send } from "./icons";
import { supabase, isConfigured } from "../lib/supabase";

export default function MediaSheet({ open, onClose, onSend }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUrl(URL.createObjectURL(f));
  }

  function reset() {
    if (url) URL.revokeObjectURL(url);
    setFile(null);
    setUrl(null);
    setUploading(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    if (!url) return;
    setError("");
    setUploading(true);
    try {
      if (!isConfigured) {
        await new Promise((r) => setTimeout(r, 700));
        onSend(url);
      } else {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `chat-media/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("chat-media")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("chat-media")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        if (!signed) throw new Error("Could not sign media URL.");
        onSend(signed.signedUrl);
      }
      setFile(null);
      setUrl(null);
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Share an image"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-surface p-5 shadow-float ring-1 ring-line sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">Share an image</h2>
              <button className="btn-ghost h-8 w-8" onClick={close} aria-label="Close">
                <X size={17} />
              </button>
            </div>

            {!url ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-line bg-surface-2 py-10 text-muted transition-all duration-200 hover:border-brand/30 hover:bg-brand-soft/30 hover:text-brand-ink hover:shadow-xs"
              >
                <Image size={28} />
                <span className="text-[13.5px] font-semibold">Choose a photo</span>
                <span className="text-[11.5px] text-faint">PNG or JPG · up to 10MB</span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-2xl ring-1 ring-line">
                <img src={url} alt="Selected preview" className="max-h-72 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="truncate text-[12px] text-muted">{file?.name}</span>
                  <button onClick={reset} className="text-[12px] font-semibold text-brand hover:text-brand-hover">
                    Change
                  </button>
                </div>
              </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600 ring-1 ring-red-100" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-full px-4 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!url || uploading}
                className="btn-primary px-4 py-2 text-[13px] disabled:opacity-50"
              >
                {uploading ? "Uploading..." : (<><Send size={15} /> Send</>)}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
