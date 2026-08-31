import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import ChatMenu from "./ChatMenu";
import { ArrowLeft, Phone, Video, Languages, Sparkle, ChevronDown } from "./icons";
import { getMessages, subscribe, createMessage, simulateReply, deleteMessage, clearChat, isDemo } from "../lib/store";
import { formatDayLabel, cx } from "../lib/utils";
import { LANGUAGES } from "../lib/languages";

function groupByDay(messages) {
  const groups = [];
  let currentLabel = null;
  for (const m of messages) {
    const label = formatDayLabel(m.created_at);
    if (label !== currentLabel) {
      groups.push({ label, items: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].items.push(m);
  }
  return groups;
}

export default function ChatView({ contact, onBack, onAttach, settings }) {
  const [messages, setMessages] = useState([]);
  const [autoTranslate, setAutoTranslate] = useState(settings?.autoTranslate || false);
  const [inputLang, setInputLang] = useState(settings?.sourceLang || "en");
  const [newMsgIds, setNewMsgIds] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (settings?.sourceLang) setInputLang(settings.sourceLang);
  }, [settings?.sourceLang]);

  useEffect(() => {
    if (settings?.autoTranslate !== undefined) setAutoTranslate(settings.autoTranslate);
  }, [settings?.autoTranslate]);

  useEffect(() => {
    let alive = true;
    getMessages(contact.user_id).then((list) => {
      if (alive) setMessages(list);
    });
    const unsub = subscribe(contact.user_id, (incoming) => {
      if (Array.isArray(incoming)) {
        setMessages([...incoming]);
      } else {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === incoming.message_id)) return prev;
          setNewMsgIds((prevSet) => new Set([...prevSet, incoming.message_id]));
          const isFromOther = incoming.sender_id !== "u_me";
          if (isFromOther) setUnreadCount((c) => c + 1);
          setTimeout(() => {
            setNewMsgIds((prevSet) => {
              const next = new Set(prevSet);
              next.delete(incoming.message_id);
              return next;
            });
          }, 3000);
          return [...prev, incoming];
        });
      }
    });
    return () => { alive = false; unsub(); };
  }, [contact.user_id]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (atBottom) setUnreadCount(0);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function scrollToBottom() {
    setUnreadCount(0);
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function handleSend({ text, sourceLang }) {
    const targetLang = contact.preferred_language || "ja";
    createMessage({ contactId: contact.user_id, text, sourceLang, targetLang });
    if (isDemo) {
      const delay = 1400 + Math.random() * 1600;
      const myLang = settings?.sourceLang || "en";
      setTimeout(() => simulateReply(contact.user_id, myLang), delay);
    }
  }

  function handleDelete(msgId) {
    deleteMessage(contact.user_id, msgId);
    setMessages((prev) => prev.filter((m) => m.message_id !== msgId));
  }

  function handleClearChat() {
    clearChat(contact.user_id);
    setMessages([]);
  }

  const groups = useMemo(() => groupByDay(messages), [messages]);
  const lang = LANGUAGES[contact.preferred_language];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="z-30 flex items-center gap-3 border-b border-line bg-surface/80 px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <button onClick={onBack} className="btn-ghost h-9 w-9 md:hidden" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <Avatar name={contact.username} accent={contact.accent} status={contact.status} size={44} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[15px] font-semibold text-ink">{contact.username}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted">
            {contact.status === "typing" ? (
              <span className="font-medium text-accent">typing...</span>
            ) : contact.status === "online" ? (
              <span className="text-brand">online</span>
            ) : (
              <span>{contact.role}</span>
            )}
            <span className="text-line">·</span>
            <span className={cx("text-faint", lang.font)}>{lang.native}</span>
          </div>
        </div>

        <button
          onClick={() => setAutoTranslate((v) => !v)}
          className={cx(
            "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 transition-all duration-200 sm:inline-flex",
            autoTranslate ? "bg-accent-soft text-accent ring-accent/20 shadow-xs" : "text-muted ring-line hover:text-ink hover:bg-surface-2"
          )}
          aria-pressed={autoTranslate}
        >
          <Languages size={15} />
          Auto-translate
          <span className={cx("h-1.5 w-1.5 rounded-full transition-colors", autoTranslate ? "bg-accent" : "bg-line-strong")} />
        </button>

        <div className="flex items-center">
          <button className="btn-ghost h-9 w-9" aria-label="Voice call">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <ChatMenu onClearChat={handleClearChat} contactName={contact.username} />
        </div>
      </header>

      {/* Mobile auto-translate strip */}
      <button
        onClick={() => setAutoTranslate((v) => !v)}
        className={cx(
          "flex items-center justify-center gap-1.5 border-b border-line py-1.5 text-[12px] font-semibold transition-colors sm:hidden",
          autoTranslate ? "bg-accent-soft text-accent" : "bg-surface text-muted"
        )}
      >
        <Languages size={13} /> Auto-translate {autoTranslate ? "on" : "off"}
      </button>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="chat-canvas min-h-0 flex-1 overflow-y-auto scrollbar-thin relative">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-3 py-6 sm:px-4">
          <IntroCard contact={contact} />
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-3">
              <div className="sticky top-2 z-10 mx-auto w-fit rounded-full bg-surface/90 px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-faint shadow-xs ring-1 ring-line backdrop-blur-sm">
                {g.label}
              </div>
              {g.items.map((m) => (
                <MessageBubble
                  key={m.message_id}
                  msg={m}
                  autoTranslate={autoTranslate}
                  isNew={newMsgIds.has(m.message_id)}
                  onDelete={() => handleDelete(m.message_id)}
                  myLang={settings?.sourceLang || "en"}
                />
              ))}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* New message notification bar */}
        {unreadCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 z-20 mx-auto flex w-fit items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-lg transition-all duration-300 hover:bg-brand-hover hover:shadow-xl"
          >
            <ChevronDown size={16} />
            You have {unreadCount} new message{unreadCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Composer */}
      <Composer
        inputLang={inputLang}
        setInputLang={setInputLang}
        onSend={handleSend}
        onAttach={onAttach}
        targetLang={contact.preferred_language}
      />
    </div>
  );
}

function IntroCard({ contact }) {
  const lang = LANGUAGES[contact.preferred_language];
  return (
    <div className="mx-auto mb-2 flex max-w-md flex-col items-center gap-3 rounded-2xl bg-surface/70 px-6 py-6 text-center ring-1 ring-line backdrop-blur-sm">
      <Avatar name={contact.username} accent={contact.accent} size={56} />
      <div className="text-[15px] font-semibold text-ink">{contact.username}</div>
      <p className="text-[13px] leading-relaxed text-muted pretty max-w-[35ch]">
        {contact.username.split(" ")[0]} writes in{" "}
        <span className={cx("font-medium text-ink", lang.font)}>{lang.native}</span>.
        Messages are translated for you, and Lingua checks your grammar before you send.
      </p>
      <div className="mt-1 flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand-ink">
        <Sparkle size={12} /> End-to-end · AI assisted
      </div>
    </div>
  );
}
