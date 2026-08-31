/**
 * store.js — data layer with two modes.
 *
 * REAL  : Supabase (Auth + Postgres + Realtime + Storage), per PRD §3/§5.
 * DEMO  : the same interface served from in-memory mock data, so the app
 *         still runs before keys are configured.
 *
 * The rest of the UI only talks to the functions below — no Supabase imports
 * outside this file.
 */
import { supabase, isConfigured } from "./supabase";
import { translateMessage } from "./translation";

export const isDemo = !isConfigured;

// ---------------------------------------------------------------- demo mode
export const ME_DEMO = {
  user_id: "u_me",
  username: "Ayan",
  profile_picture: "",
  preferred_language: "bn",
};

export const CONTACTS_DEMO = [
  { user_id: "u_yuki", username: "Yuki Tanaka", preferred_language: "ja", accent: "oklch(0.72 0.15 38)", status: "online", role: "Language partner · Tokyo" },
  { user_id: "u_haru", username: "Haruto Mori", preferred_language: "ja", accent: "oklch(0.62 0.13 250)", status: "typing", role: "Study group" },
  { user_id: "u_sensei", username: "Aiko Sensei", preferred_language: "ja", accent: "oklch(0.6 0.14 150)", status: "online", role: "Tutor" },
  { user_id: "u_rin", username: "Rin Kobayashi", preferred_language: "ja", accent: "oklch(0.64 0.14 20)", status: "away", role: "Pen pal · Osaka" },
];

let idSeq = 100;
const nextId = () => `m_${idSeq++}`;
const t = (minsAgo) => new Date(Date.now() - minsAgo * 60000).toISOString();

const SEED = {
  u_yuki: [
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "こんばんは！", source_language: "ja", target_language: "bn", translated_text: "শুভ সন্ধ্যা!", media_url: null, created_at: t(58) },
    { message_id: nextId(), sender_id: "u_me", receiver_id: "u_yuki", original_text: "こんばんは、げんきですか", source_language: "ja", target_language: "bn", translated_text: null, media_url: null, created_at: t(56) },
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "げんきです！たのしみ", source_language: "ja", target_language: "bn", translated_text: null, media_url: null, created_at: t(55) },
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "", source_language: "ja", target_language: "bn", translated_text: null, media_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=900&auto=format&fit=crop", created_at: t(40) },
    { message_id: nextId(), sender_id: "u_me", receiver_id: "u_yuki", original_text: "また あした", source_language: "ja", target_language: "bn", translated_text: null, media_url: null, created_at: t(38) },
  ],
  u_haru: [{ message_id: nextId(), sender_id: "u_haru", receiver_id: "u_me", original_text: "おなかすいた", source_language: "ja", target_language: "bn", translated_text: null, media_url: null, created_at: t(120) }],
  u_sensei: [{ message_id: nextId(), sender_id: "u_sensei", receiver_id: "u_me", original_text: "おはようございます", source_language: "ja", target_language: "bn", translated_text: "সুপ্রভাত (ভদ্র রূপ)", media_url: null, created_at: t(300) }],
  u_rin: [{ message_id: nextId(), sender_id: "u_rin", receiver_id: "u_me", original_text: "ありがとう", source_language: "ja", target_language: "bn", translated_text: null, media_url: null, created_at: t(1440) }],
};

const messagesByContact = JSON.parse(JSON.stringify(SEED));
const listeners = new Map();

// ---------------------------------------------------------------- real mode
let ME = ME_DEMO;
let contacts = JSON.parse(JSON.stringify(CONTACTS_DEMO));

/** deterministic accent from an id, so avatars stay stable per user */
function accentFor(id) {
  const hues = [38, 250, 150, 20, 280, 90, 330, 200];
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const hue = hues[h % hues.length];
  return `oklch(0.62 0.13 ${hue})`;
}

function shapeContact(row) {
  return {
    user_id: row.user_id,
    username: row.username,
    preferred_language: row.preferred_language || "ja",
    accent: accentFor(row.user_id),
    status: undefined,
    role: "Learns together",
  };
}

/**
 * Boot real mode: load session + own profile + only friends.
 * Returns { me, contacts } or null when signed out / not configured.
 */
export async function boot() {
  if (isDemo) return { me: ME_DEMO, contacts: CONTACTS_DEMO, signedIn: true };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { signedIn: false };

  const { data: me, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error || !me) return { signedIn: false };

  ME = { ...me, user_id: me.user_id, profile_picture: me.profile_picture || "" };

  // Only fetch friends
  const { data: friendRows } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", session.user.id);

  if (!friendRows || friendRows.length === 0) {
    contacts = [];
    return { me: ME, contacts, signedIn: true };
  }

  const friendIds = friendRows.map((r) => r.friend_id);

  const { data: friendProfiles } = await supabase
    .from("profiles")
    .select("*")
    .in("user_id", friendIds);

  contacts = (friendProfiles || []).map(shapeContact);
  return { me: ME, contacts, signedIn: true };
}

/** Search profiles by username (for adding friends) */
export async function searchUsers(query) {
  if (isDemo || !query.trim()) return [];
  const { data } = await supabase
    .from("profiles")
    .select("user_id, username, preferred_language")
    .ilike("username", `%${query.trim()}%`)
    .neq("user_id", ME.user_id)
    .limit(10);
  return data || [];
}

/** Add a friend (bidirectional) */
export async function addFriend(friendId) {
  if (isDemo) return true;
  const { error } = await supabase
    .from("friends")
    .insert({ user_id: ME.user_id, friend_id: friendId });
  if (error) {
    console.error("[addFriend]", error);
    return false;
  }
  // Also add reverse so friend sees us
  await supabase
    .from("friends")
    .insert({ user_id: friendId, friend_id: ME.user_id })
    .catch(() => {});
  return true;
}

/** Remove a friend (bidirectional) */
export async function removeFriend(friendId) {
  if (isDemo) return;
  await supabase
    .from("friends")
    .delete()
    .eq("user_id", ME.user_id)
    .eq("friend_id", friendId);
  await supabase
    .from("friends")
    .delete()
    .eq("user_id", friendId)
    .eq("friend_id", ME.user_id);
}

export function getContacts() {
  return contacts;
}

export function getMe() {
  return ME;
}

export async function signOut() {
  if (isDemo) return;
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------- messages
export async function getMessages(contactId) {
  if (isDemo) return messagesByContact[contactId] || [];

  const me = ME.user_id;
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me})`)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[getMessages]", error);
    return [];
  }
  return data || [];
}

export async function lastMessage(contactId) {
  const list = await getMessages(contactId);
  return list[list.length - 1] || null;
}

export async function createMessage({ contactId, text, mediaUrl = null, sourceLang, targetLang }) {
  let translatedText = null;
  if (text.trim()) {
    try {
      const { translation } = await translateMessage({ text, sourceLang, targetLang });
      translatedText = translation;
    } catch (e) {
      console.warn("[createMessage] translate failed, saving without translation", e);
    }
  }

  const msg = {
    sender_id: ME.user_id,
    receiver_id: contactId,
    original_text: text,
    translated_text: translatedText,
    source_language: sourceLang,
    target_language: targetLang,
    media_url: mediaUrl,
  };

  if (isDemo) {
    const full = { message_id: nextId(), created_at: new Date().toISOString(), ...msg };
    messagesByContact[contactId] = [...(messagesByContact[contactId] || []), full];
    emit(contactId);
    return full;
  }

  const { data, error } = await supabase.from("messages").insert(msg).select().single();
  if (error) {
    console.error("[createMessage]", error);
    return null;
  }
  return data;
}

/** Demo only: pretend the other side answered over the realtime channel. */
export function simulateReply(contactId) {
  const replies = [
    { text: "そうだね！", tr: "ঠিক বলেছো!" },
    { text: "いいね", tr: "দারুণ!" },
    { text: "また あとで", tr: "পরে কথা হবে" },
    { text: "だいじょうぶ", tr: "সমস্যা নেই" },
    { text: "たのしみ", tr: "অপেক্ষায় আছি" },
  ];
  const pick = replies[Math.floor(Math.random() * replies.length)];
  const msg = {
    message_id: nextId(),
    sender_id: contactId,
    receiver_id: ME.user_id,
    original_text: pick.text,
    source_language: "ja",
    target_language: "bn",
    translated_text: pick.tr,
    media_url: null,
    created_at: new Date().toISOString(),
  };
  messagesByContact[contactId] = [...(messagesByContact[contactId] || []), msg];
  emit(contactId);
}

// ---------------------------------------------------------------- realtime
function emit(contactId) {
  const set = listeners.get(contactId);
  if (set) set.forEach((fn) => fn(messagesByContact[contactId]));
}

let channel = null;

/**
 * Subscribe to live message delivery. REAL mode uses a Supabase Realtime
 * channel; DEMO mode uses in-memory listeners. Returns an unsubscribe fn
 * synchronously so components can call it in useEffect cleanups.
 */
export function subscribe(contactId, fn) {
  if (!listeners.has(contactId)) listeners.set(contactId, new Set());
  listeners.get(contactId).add(fn);

  if (!isDemo && !channel) {
    channel = supabase
      .channel("messages-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const otherId =
            msg.sender_id === ME.user_id ? msg.receiver_id : msg.sender_id;
          const set = listeners.get(otherId);
          if (set) set.forEach((cb) => cb(msg));
        }
      )
      .subscribe();
  }

  return () => listeners.get(contactId)?.delete(fn);
}
