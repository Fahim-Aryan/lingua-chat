import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Check } from "./icons";
import { searchUsers, addFriend } from "../lib/store";
import { cx } from "../lib/utils";

export default function AddFriend({ open, onClose, onAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set());

  if (!open) return null;

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const users = await searchUsers(query);
      setResults(users);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(userId) {
    const ok = await addFriend(userId);
    if (ok) {
      setAdded((prev) => new Set(prev).add(userId));
      onAdded?.();
    }
  }

  function handleClose() {
    setQuery("");
    setResults([]);
    setAdded(new Set());
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
          onClick={(e) => e.target === e.currentTarget && handleClose()}
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
              <h2 className="text-[17px] font-extrabold text-ink">Add Friend</h2>
              <button onClick={handleClose} className="btn-ghost h-9 w-9" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Search input */}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-2.5 ring-1 ring-line transition-all duration-200 focus-within:bg-surface focus-within:shadow-sm focus-within:ring-brand/30">
                  <Search size={17} className="shrink-0 text-faint" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search by username..."
                    className="w-full bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="btn-primary shrink-0 px-4 py-2.5 text-[13px]"
                >
                  {loading ? "..." : "Search"}
                </button>
              </div>

              {/* Results */}
              <div className="mt-4 space-y-2">
                {results.length === 0 && query && !loading && (
                  <p className="py-6 text-center text-[13px] text-faint">
                    {query.trim() ? "No users found. Try another name." : "Search for someone to add."}
                  </p>
                )}
                {results.map((user) => {
                  const isAdded = added.has(user.user_id);
                  return (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[15px] font-bold text-brand">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-ink">{user.username}</div>
                        <div className="text-[12px] text-muted">{user.preferred_language === "ja" ? "日本語" : "বাংলা"}</div>
                      </div>
                      <button
                        onClick={() => handleAdd(user.user_id)}
                        disabled={isAdded}
                        className={cx(
                          "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-all duration-200",
                          isAdded
                            ? "bg-brand-soft text-brand-ink"
                            : "bg-brand text-white hover:bg-brand-hover active:scale-95"
                        )}
                      >
                        {isAdded ? (
                          <><Check size={13} /> Added</>
                        ) : (
                          <><UserPlus size={13} /> Add</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-[11.5px] text-faint">
                Both users will appear in each other's inbox after adding.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
