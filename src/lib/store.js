import { supabase, isConfigured } from "./supabase";
import { translateMessage } from "./translation";

export const isDemo = !isConfigured;

export const ME_DEMO = {
  user_id: "u_me",
  username: "You",
  profile_picture: "",
  preferred_language: "en",
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
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "こんばんは！", source_language: "ja", target_language: "en", translated_text: "Good evening!", media_url: null, created_at: t(58) },
    { message_id: nextId(), sender_id: "u_me", receiver_id: "u_yuki", original_text: "Good evening, how are you?", source_language: "en", target_language: "ja", translated_text: "こんばんは、お元気ですか？", media_url: null, created_at: t(56) },
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "げんきです！たのしみ", source_language: "ja", target_language: "en", translated_text: "I'm great! Looking forward to it.", media_url: null, created_at: t(55) },
    { message_id: nextId(), sender_id: "u_yuki", receiver_id: "u_me", original_text: "", source_language: "ja", target_language: "en", translated_text: null, media_url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=900&auto=format&fit=crop", created_at: t(40) },
    { message_id: nextId(), sender_id: "u_me", receiver_id: "u_yuki", original_text: "See you tomorrow", source_language: "en", target_language: "ja", translated_text: "またあした", media_url: null, created_at: t(38) },
  ],
  u_haru: [
    { message_id: nextId(), sender_id: "u_haru", receiver_id: "u_me", original_text: "おなかすいた", source_language: "ja", target_language: "en", translated_text: "I'm hungry.", media_url: null, created_at: t(120) },
  ],
  u_sensei: [
    { message_id: nextId(), sender_id: "u_sensei", receiver_id: "u_me", original_text: "おはようございます", source_language: "ja", target_language: "en", translated_text: "Good morning! (polite)", media_url: null, created_at: t(300) },
  ],
  u_rin: [
    { message_id: nextId(), sender_id: "u_rin", receiver_id: "u_me", original_text: "ありがとう", source_language: "ja", target_language: "en", translated_text: "Thank you!", media_url: null, created_at: t(1440) },
  ],
};

const messagesByContact = JSON.parse(JSON.stringify(SEED));
const listeners = new Map();
const anyListeners = new Set();

export function onAnyMessage(fn) {
  anyListeners.add(fn);
  return () => anyListeners.delete(fn);
}

function emitAny(event) {
  anyListeners.forEach((fn) => fn(event));
}

let ME = ME_DEMO;
let contacts = JSON.parse(JSON.stringify(CONTACTS_DEMO));

function accentFor(id) {
  const hues = [38, 250, 150, 20, 280, 90, 330, 200];
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return `oklch(0.62 0.13 ${hues[h % hues.length]})`;
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

export async function boot() {
  if (isDemo) return { me: ME_DEMO, contacts: CONTACTS_DEMO, signedIn: true };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { signedIn: false };
  const { data: me, error } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
  if (error || !me) return { signedIn: false };
  ME = { ...me, user_id: me.user_id, profile_picture: me.profile_picture || "" };
  const { data: friendRows } = await supabase.from("friends").select("friend_id").eq("user_id", session.user.id);
  if (!friendRows || friendRows.length === 0) { contacts = []; return { me: ME, contacts, signedIn: true }; }
  const friendIds = friendRows.map((r) => r.friend_id);
  const { data: friendProfiles } = await supabase.from("profiles").select("*").in("user_id", friendIds);
  contacts = (friendProfiles || []).map(shapeContact);
  return { me: ME, contacts, signedIn: true };
}

export async function searchUsers(query) {
  if (isDemo || !query.trim()) return [];
  const { data } = await supabase.from("profiles").select("user_id, username, preferred_language").ilike("username", `%${query.trim()}%`).neq("user_id", ME.user_id).limit(10);
  return data || [];
}

export async function addFriend(friendId) {
  if (isDemo) return true;
  const { error } = await supabase.from("friends").insert({ user_id: ME.user_id, friend_id: friendId });
  if (error) return false;
  await supabase.from("friends").insert({ user_id: friendId, friend_id: ME.user_id }).catch(() => {});
  return true;
}

export async function removeFriend(friendId) {
  if (isDemo) return;
  await supabase.from("friends").delete().eq("user_id", ME.user_id).eq("friend_id", friendId);
  await supabase.from("friends").delete().eq("user_id", friendId).eq("friend_id", ME.user_id);
}

export function getContacts() { return contacts; }
export function getMe() { return ME; }

export async function signOut() {
  if (isDemo) return;
  await supabase.auth.signOut();
}

export async function getMessages(contactId) {
  if (isDemo) return messagesByContact[contactId] || [];
  const me = ME.user_id;
  const { data, error } = await supabase
    .from("messages").select("*")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me})`)
    .order("created_at", { ascending: true });
  if (error) return [];
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
      console.warn("[createMessage] translate failed", e);
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
    emitAny({ kind: "message", msg: full });
    return full;
  }
  const { data, error } = await supabase.from("messages").insert(msg).select().single();
  if (error) return null;
  return data;
}

export function simulateReply(contactId, myLang = "en") {
  const replies = [
    { ja: "そうだね！", en: "That's right!", bn: "ঠিক বলেছো!" },
    { ja: "いいね", en: "Nice!", bn: "দারুণ!" },
    { ja: "また あとで", en: "Talk later!", bn: "পরে কথা হবে" },
    { ja: "だいじょうぶ", en: "It's okay!", bn: "সমস্যা নেই" },
    { ja: "たのしみ", en: "Looking forward to it!", bn: "অপেক্ষায় আছি" },
    { ja: "こんにちは", en: "Hello!", bn: "হ্যালো!" },
    { ja: "ありがとう", en: "Thank you!", bn: "ধন্যবাদ!" },
    { ja: "おはよう", en: "Good morning!", bn: "সুপ্রভাত!" },
  ];
  const pick = replies[Math.floor(Math.random() * replies.length)];
  const msg = {
    message_id: nextId(),
    sender_id: contactId,
    receiver_id: ME.user_id,
    original_text: pick.ja,
    source_language: "ja",
    target_language: myLang,
    translated_text: pick[myLang] || pick.en,
    media_url: null,
    created_at: new Date().toISOString(),
  };
  messagesByContact[contactId] = [...(messagesByContact[contactId] || []), msg];
  emit(contactId);
  emitAny({ kind: "message", msg });
}

function emit(contactId) {
  const set = listeners.get(contactId);
  if (set) set.forEach((fn) => fn(messagesByContact[contactId]));
}

export function deleteMessage(contactId, messageId) {
  if (isDemo) {
    messagesByContact[contactId] = (messagesByContact[contactId] || []).filter((m) => m.message_id !== messageId);
    emit(contactId);
    return;
  }
  supabase.from("messages").delete().eq("message_id", messageId).then(() => emit(contactId));
}

export function clearChat(contactId) {
  if (isDemo) {
    messagesByContact[contactId] = [];
    emit(contactId);
    return;
  }
  const me = ME.user_id;
  supabase.from("messages").delete()
    .or(`and(sender_id.eq.${me},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me})`)
    .then(() => emit(contactId));
}

let channel = null;

export function subscribe(contactId, fn) {
  if (!listeners.has(contactId)) listeners.set(contactId, new Set());
  listeners.get(contactId).add(fn);
  if (!isDemo && !channel) {
    channel = supabase.channel("messages-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new;
        const otherId = msg.sender_id === ME.user_id ? msg.receiver_id : msg.sender_id;
        const set = listeners.get(otherId);
        if (set) set.forEach((cb) => cb(msg));
        emitAny({ kind: "message", msg });
      }).subscribe();
  }
  return () => listeners.get(contactId)?.delete(fn);
}
