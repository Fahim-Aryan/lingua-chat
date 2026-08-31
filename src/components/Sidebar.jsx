import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import { Search, Sparkle, Plus, Settings, UserPlus } from "./icons";
import { lastMessage, getMe } from "../lib/store";
import { relativeShort, cx, isJapanese } from "../lib/utils";

function Preview({ msg }) {
  if (!msg) return <span className="text-faint">Start a conversation</span>;
  if (msg.media_url && !msg.original_text)
    return <span className="text-muted">Photo</span>;
  const jp = isJapanese(msg.original_text);
  return (
    <span className={cx("truncate", jp && "font-jp")}>
      {msg.sender_id === getMe().user_id && <span className="text-faint">You: </span>}
      {msg.original_text}
    </span>
  );
}

export default function Sidebar({ contacts, activeId, onSelect, tick, onSettings, onAddFriend, profilePicture }) {
  const [query, setQuery] = useState("");
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let alive = true;
    Promise.all(
      contacts.map(async (c) => ({
        id: c.user_id,
        last: await lastMessage(c.user_id),
      }))
    ).then((rows) => {
      if (!alive) return;
      const map = {};
      rows.forEach((r) => (map[r.id] = r.last));
      setPreviews(map);
    });
    return () => { alive = false; };
  }, [contacts, tick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.username.toLowerCase().includes(q));
  }, [contacts, query]);

  const me = getMe();

  return (
    <aside className="flex h-full min-h-0 flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
            <Sparkle size={20} />
          </div>
          <div className="leading-none">
            <div className="text-[17px] font-extrabold tracking-tight text-ink">Lingua</div>
            <div className="mt-1 text-[11.5px] font-medium text-brand">translate as you type</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddFriend}
            className="btn-ghost h-10 w-10"
            aria-label="Add friend"
            title="Add friend"
          >
            <UserPlus size={20} />
          </button>
          <button
            className="btn-ghost h-10 w-10"
            aria-label="New conversation"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5 py-2.5 transition-all duration-200 focus-within:bg-surface focus-within:shadow-sm focus-within:ring-1 focus-within:ring-brand/30">
          <Search size={17} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"
            aria-label="Search people"
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-faint">No one by that name.</p>
        )}
        {filtered.map((c) => {
          const active = c.user_id === activeId;
          const typing = c.status === "typing";
          const last = previews[c.user_id] || null;
          return (
            <button
              key={c.user_id}
              onClick={() => onSelect(c.user_id)}
              className={cx(
                "group relative flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                active
                  ? "bg-brand-soft shadow-xs"
                  : "hover:bg-surface-2"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
              )}
              <Avatar name={c.username} accent={c.accent} status={c.status} size={48} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cx(
                    "truncate text-[14.5px] font-semibold",
                    active ? "text-brand-ink" : "text-ink"
                  )}>
                    {c.username}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-faint">
                    {last ? relativeShort(last.created_at) : ""}
                  </span>
                </span>
                <span className="mt-1 flex items-center gap-1 text-[13px] text-muted">
                  {typing ? (
                    <span className="flex items-center gap-1 font-medium text-accent">
                      typing
                      <span className="flex gap-[3px]">
                        <i className="h-[5px] w-[5px] rounded-full bg-accent animate-dot-bounce" />
                        <i className="h-[5px] w-[5px] rounded-full bg-accent animate-dot-bounce [animation-delay:0.15s]" />
                        <i className="h-[5px] w-[5px] rounded-full bg-accent animate-dot-bounce [animation-delay:0.3s]" />
                      </span>
                    </span>
                  ) : (
                    <Preview msg={last} />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Self footer */}
      <footer className="flex items-center gap-3 border-t border-line px-4 py-3.5">
        <Avatar name={me.username} accent="var(--brand)" size={40} image={profilePicture} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13.5px] font-semibold text-ink">{me.username}</div>
          <div className="mt-0.5 text-[11px] text-muted">
            {contacts.length === 0 ? "No friends yet" : `${contacts.length} friend${contacts.length > 1 ? "s" : ""}`}
          </div>
        </div>
        <button
          onClick={onSettings}
          className="btn-ghost h-9 w-9"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </footer>
    </aside>
  );
}
