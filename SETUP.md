# Lingua — Setup Guide (বাংলা)

Real-time translation chat app। Frontend (React) + Backend (Node/Express + Gemini) + Supabase (Auth / DB / Realtime / Storage)।

**বর্তমান অবস্থা:** ডিজাইন + সম্পূর্ণ ফ্রন্টএন্ড + ব্যাকএন্ড কোড ready। নিচের ধাপগুলো করলেই real chat কাজ শুরু করবে।

---

## ধাপ ১ — কোড চালানো (ডেমো মোড)

কোনো key ছাড়াই ডিজাইন দেখা যাবে:

```bash
npm install          # root-এ (frontend)
npm run dev          # http://localhost:5173

# আরেকটা terminal-এ (backend, ঐচ্ছিক)
cd server
npm install
npm run dev          # http://localhost:4000
```

ডেমো মোডে: login skip হবে, fake contacts/messages দেখাবে, translation local mock dictionary দিয়ে চলবে।

---

## ধাপ ২ — Gemini API key (ফ্রি)

1. যান: https://aistudio.google.com/apikey
2. Google account দিয়ে **Create API key**
3. key কপি করুন

```bash
cd server
copy .env.example .env    # Windows
# .env ফাইলটা খুলে লিখুন:
GEMINI_API_KEY=আপনার_কি_এখানে
```

4. `cd server && npm run dev` → এখন `/api/translate/live` real Gemini দিয়ে কাজ করবে।

---

## ধাপ ৩ — Supabase (ফ্রি) — Auth + Database + Realtime + Storage

1. যান: https://supabase.com → **New project** (name: `lingua`, password রাখুন)
2. Project তৈরি হলে **Settings → API** থেকে কপি করুন:
   - `Project URL` (যেমন `https://abcd.supabase.co`)
   - `anon public key`
3. বাম মেনুতে **SQL Editor** → নতুন query → নিচের ফাইলের সব কপি-পেস্ট করে **Run**:
   ```
   supabase/schema.sql
   ```
   (এটা profiles, messages table + RLS + realtime + storage bucket বানিয়ে দেয়)

4. Root-এ `.env` ফাইল বানান:
   ```bash
   copy .env.example .env
   ```
   ```env
   VITE_SUPABASE_URL=https://আপনার_project.supabase.co
   VITE_SUPABASE_ANON_KEY=আপনার_anon_key
   VITE_API_URL=http://localhost:4000
   ```

5. `npm run dev` — এখন **real login/signup** চলে। দুইটা account খুলুন (যেমন a@x.com, b@x.com) → দুই ব্রাউজারে (বা incognito) login করলে দুইজনে real-time message আদান-প্রদান হবে।

---

## ধাপ ৪ — সবকিছু একসাথে চালানো

| Terminal | Command | কাজ |
|----------|---------|-----|
| 1 | `npm run dev` (root) | Frontend :5173 |
| 2 | `cd server && npm run dev` | Backend :4000 (Gemini proxy) |

Supabase browser-এ realtime চালু থাকলে page refresh ছাড়াই message পৌঁছাবে।

---

## কিভাবে কাজ করে (সংক্ষেপ)

```
User টাইপ করে → 400ms debounce → POST /api/translate/live
  → Node/Express → Gemini API → JSON {translation, corrected_text, tips}
  → Live preview card

Send চাপলে → INSERT messages table (Supabase)
  → Realtime channel → receiver-এর screen instant update
  → Receiver "Translate" চাপলে → POST /api/translate/message → Gemini

Image পাঠালে → Supabase Storage bucket → signed URL → messages table
```

## Structure

```
├── src/                    # React frontend
│   ├── components/         # Sidebar, ChatView, Composer, LivePreview, KanaKeyboard...
│   └── lib/
│       ├── supabase.js     # Supabase client (env থেকে)
│       ├── store.js        # DEMO ↔ REAL mode switch
│       ├── translation.js  # মক ↔ real backend switch
│       └── kana.js         # Romaji → Hiragana/Katakana engine
├── server/
│   ├── index.js            # Express + Gemini endpoints
│   └── .env.example
└── supabase/schema.sql     # Table + RLS + Realtime + Storage
```

## সমস্যা হলে

- **Backend error `API key not valid`** → `.env`-এর key ঠিক আছে কিনা দেখুন
- **Login work করছে না** → `.env`-এ URL/key ভুল হলে, অথবা email confirmation on থাকলে email চেক করুন
- **Real-time কাজ করছে না** → `supabase/schema.sql` আবার run করুন (realtime publication নিশ্চিত)
- **CORS error** → backend-এ `cors()` ইতিমধ্যে সব permit করে; তবু সমস্যা হলে frontend `.env`-এর `VITE_API_URL` মিলিয়ে দেখুন
