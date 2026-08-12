import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import EmptyState from "./components/EmptyState";
import MediaSheet from "./components/MediaSheet";
import Login from "./components/Login";
import { boot, getContacts, createMessage, signOut, isDemo } from "./lib/store";
import { supabase, isConfigured } from "./lib/supabase";
import { cx } from "./lib/utils";

export default function App() {
  const [authed, setAuthed] = useState(isDemo ? true : false);
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [tick, setTick] = useState(0);

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

  if (!authed) return <Login onEnter={() => setAuthed(true)} />;

  function sendMedia(url) {
    if (!activeContact) return;
    createMessage({
      contactId: activeContact.user_id,
      text: "",
      mediaUrl: url,
      sourceLang: "ja",
      targetLang: "bn",
    });
    setTick((t) => t + 1);
  }

  async function handleSignOut() {
    await signOut();
    if (isDemo) return;
    setAuthed(false);
    setContacts([]);
  }

  return (
    <div className="grid h-full w-full grid-cols-1 bg-bg md:grid-cols-[minmax(300px,360px)_1fr]">
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
          onSignOut={handleSignOut}
          canSignOut={!isDemo}
        />
      </div>

      <main className={cx("min-h-0", activeContact ? "block" : "hidden md:block")}>
        {activeContact ? (
          <ChatView
            key={activeContact.user_id}
            contact={activeContact}
            onBack={() => setActiveId(null)}
            onAttach={() => setMediaOpen(true)}
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
    </div>
  );
}
