import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import EmptyState from "./components/EmptyState";
import MediaSheet from "./components/MediaSheet";
import Login from "./components/Login";
import Settings from "./components/Settings";
import AddFriend from "./components/AddFriend";
import { boot, getContacts, createMessage, isDemo, onAnyMessage, getMe } from "./lib/store";
import { supabase, isConfigured } from "./lib/supabase";
import { playPop, notifyMessage, askNotificationPermission } from "./lib/notify";
import { cx } from "./lib/utils";

const SETTINGS_VERSION = 4;
const DEFAULT_SETTINGS = {
  _v: SETTINGS_VERSION,
  username: "You",
  sourceLang: "en",
  targetLang: "ja",
  theme: "light",
  autoTranslate: false,
  profile_picture: "",
};

function loadSettings() {
  try {
    const raw = localStorage.getItem("lingua_settings");
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed._v !== SETTINGS_VERSION) {
      localStorage.removeItem("lingua_settings");
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s) {
  localStorage.setItem("lingua_settings", JSON.stringify(s));
}

export default function App() {
  const [authed, setAuthed] = useState(isDemo ? true : false);
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [unread, setUnread] = useState({});
  const contactsRef = useRef([]);
  contactsRef.current = contacts;
  const [vvh, setVvh] = useState(() =>
    typeof window !== "undefined" && window.visualViewport ? window.visualViewport.height : window.innerHeight
  );

  // Track keyboard / toolbar resizing so the composer stays above the keyboard.
  // Also pin the window scroll to 0 — iOS Safari pans the page up when the
  // keyboard opens, which would push the app (fixed height) out of view.
  useEffect(() => {
    const vv = window.visualViewport;
    const sync = () => {
      if (vv) setVvh(vv.height);
      window.scrollTo(0, 0);
    };
    sync();
    if (vv) {
      vv.addEventListener("resize", sync);
      vv.addEventListener("scroll", sync);
    }
    window.addEventListener("scroll", sync);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", sync);
        vv.removeEventListener("scroll", sync);
      }
      window.removeEventListener("scroll", sync);
    };
  }, []);

  // Mark unread badges + refresh sidebar previews whenever a message lands anywhere.
  // Also play a sound and fire a browser notification for incoming messages.
  useEffect(() => {
    const off = onAnyMessage((e) => {
      if (!e?.msg) return;
      const meId = getMe().user_id;
      const otherId = e.msg.sender_id === meId ? e.msg.receiver_id : e.msg.sender_id;
      setTick((t) => t + 1);
      if (e.msg.sender_id === meId) return; // my own message — just refresh, no alert

      playPop();
      const fromContact = contactsRef.current.find((c) => c.user_id === otherId);
      const fromName = fromContact?.username || "New message";
      const preview = e.msg.original_text || (e.msg.media_url ? "📷 Photo" : "");
      if (document.hidden || otherId !== activeId) {
        notifyMessage(fromName, preview, () => setActiveId(otherId));
      }

      if (otherId !== activeId) {
        setUnread((u) => ({ ...u, [otherId]: (u[otherId] || 0) + 1 }));
      } else {
        setUnread((u) => ({ ...u, [otherId]: 0 }));
      }
    });
    return off;
  }, [activeId]);

  // Ask for notification permission once, on the first user interaction
  // (browser requires a gesture). Audio autoplay policy also needs a gesture.
  useEffect(() => {
    const ask = () => askNotificationPermission();
    window.addEventListener("pointerdown", ask, { once: true });
    return () => window.removeEventListener("pointerdown", ask);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      settings.theme === "dark" ? "#0f1419" : "#0b3b39"
    );
  }, [settings.theme]);

  useEffect(() => {
    if (isDemo) {
      setContacts(getContacts());
      return;
    }
    boot().then((res) => {
      if (res.signedIn) {
        setContacts(res.contacts);
        setAuthed(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        const res = await boot();
        setContacts(res.contacts || []);
        setAuthed(Boolean(res.signedIn));
        setActiveId(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const activeContact = contacts.find((c) => c.user_id === activeId) || null;

  useEffect(() => {
    if (activeId) {
      window.history.pushState({ chatId: activeId }, "");
    }
  }, [activeId]);

  useEffect(() => {
    function onPopState() {
      if (activeId) setActiveId(null);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [activeId]);

  if (!authed) return <Login onEnter={() => setAuthed(true)} />;

  function sendMedia(url) {
    if (!activeContact) return;
    createMessage({
      contactId: activeContact.user_id,
      text: "",
      mediaUrl: url,
      sourceLang: settings.sourceLang,
      targetLang: settings.targetLang,
    });
    setTick((t) => t + 1);
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  return (
    <div style={{ height: vvh }} className={cx("grid w-full grid-cols-1 md:grid-cols-[minmax(300px,360px)_1fr]", settings.theme === "dark" ? "bg-bg-dark" : "bg-bg")}>
      <div className={cx("min-h-0 border-r border-line md:block", activeContact ? "hidden" : "block")}>
        <Sidebar
          contacts={contacts}
          activeId={activeId}
          unread={unread}
          onSelect={(id) => { setActiveId(id); setUnread((u) => ({ ...u, [id]: 0 })); setTick((t) => t + 1); }}
          tick={tick}
          onSettings={() => setSettingsOpen(true)}
          onAddFriend={() => setAddFriendOpen(true)}
          profilePicture={settings.profile_picture}
        />
      </div>

      <main className={cx("min-h-0", activeContact ? "block" : "hidden md:block")}>
        {activeContact ? (
          <ChatView
            key={activeContact.user_id}
            contact={activeContact}
            onBack={() => setActiveId(null)}
            onAttach={() => setMediaOpen(true)}
            settings={settings}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      <MediaSheet open={mediaOpen} onClose={() => setMediaOpen(false)} onSend={sendMedia} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={handleSaveSettings} />
      <AddFriend open={addFriendOpen} onClose={() => setAddFriendOpen(false)} onAdded={() => {
        boot().then((res) => { if (res.signedIn) setContacts(res.contacts); });
      }} />
    </div>
  );
}
