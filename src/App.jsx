import { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import EmptyState from "./components/EmptyState";
import MediaSheet from "./components/MediaSheet";
import Login from "./components/Login";
import Settings from "./components/Settings";
import AddFriend from "./components/AddFriend";
import { boot, getContacts, createMessage, signOut, isDemo } from "./lib/store";
import { supabase, isConfigured } from "./lib/supabase";
import { cx } from "./lib/utils";

const DEFAULT_SETTINGS = {
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
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
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

  // Apply theme
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

  // Push browser history when opening a chat, so back button returns to chat list
  useEffect(() => {
    if (activeId) {
      window.history.pushState({ chatId: activeId }, "");
    }
  }, [activeId]);

  useEffect(() => {
    function onPopState(e) {
      // Only handle back if we have an active chat
      if (activeId) {
        setActiveId(null);
      }
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
      targetLang: activeContact.preferred_language,
    });
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  return (
    <div className={cx("grid h-full w-full grid-cols-1 md:grid-cols-[minmax(300px,360px)_1fr]", settings.theme === "dark" ? "bg-bg-dark" : "bg-bg")}>
      <div
        className={cx(
          "min-h-0 border-r border-line md:block",
          activeContact ? "hidden" : "block"
        )}
      >
        <Sidebar
          contacts={contacts}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setTick((t) => t + 1);
          }}
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

      <MediaSheet
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSend={sendMedia}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <AddFriend
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        onAdded={() => {
          boot().then((res) => {
            if (res.signedIn) setContacts(res.contacts);
          });
        }}
      />
    </div>
  );
}
