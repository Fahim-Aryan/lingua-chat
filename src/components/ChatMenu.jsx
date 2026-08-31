import { useState, useRef, useEffect } from "react";
import { Dots, Trash2, BellOff, Ban, Flag, Info } from "./icons";
import { cx } from "../lib/utils";

export default function ChatMenu({ onClearChat, contactName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost h-9 w-9"
        aria-label="More options"
        aria-expanded={open}
      >
        <Dots size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-2xl bg-surface py-1.5 shadow-float ring-1 ring-line">
          <MenuItem icon={<Info size={16} />} label={`${contactName}'s info`} onClick={() => setOpen(false)} />
          <MenuItem icon={<BellOff size={16} />} label="Mute notifications" onClick={() => setOpen(false)} />
          <hr className="my-1 border-line" />
          <MenuItem icon={<Trash2 size={16} />} label="Clear chat" onClick={() => { onClearChat(); setOpen(false); }} danger />
          <MenuItem icon={<Ban size={16} />} label={`Block ${contactName}`} onClick={() => setOpen(false)} danger />
          <MenuItem icon={<Flag size={16} />} label={`Report ${contactName}`} onClick={() => setOpen(false)} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium transition-colors",
        danger ? "text-red-500 hover:bg-red-50" : "text-ink hover:bg-surface-2"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
