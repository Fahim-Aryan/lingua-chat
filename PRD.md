# Product Requirements Document (PRD)
## AI-Powered Real-Time Translation Chat Platform

**Document Version:** 1.0
**Last Updated:** 2026-08-12
**Status:** Draft
**Owner:** Product Team

---

## 1. Executive Summary

### 1.1 Product Overview
This platform is a real-time messaging application (WhatsApp-style) with a core differentiator: **AI-Powered Real-Time Language Assistance**. It enables users who speak different languages (primarily **Bengali ↔ Japanese**) to communicate seamlessly by providing live translation, grammar correction, and on-the-spot message translation as they type and chat.

### 1.2 Problem Statement
People who speak different native languages struggle to communicate confidently in text. Language learners and cross-lingual communicators need:
- Confidence that their message is grammatically correct before sending.
- Instant understanding of the meaning of what they type.
- Instant translation of incoming messages.
- An easy way to input non-native characters (e.g., Japanese Hiragana/Katakana) without a specialized keyboard.

### 1.3 Solution
A chat application that, while typing, provides a live preview card showing the translation and grammar tips for the current line. Incoming messages can be auto/on-demand translated. A built-in virtual keyboard supports Japanese input on standard keyboards.

### 1.4 Target Users
- Language learners (e.g., Bengali speakers learning Japanese and vice versa).
- Cross-lingual friends, families, and colleagues.
- Anyone who needs assisted cross-language text communication.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals
| # | Goal |
|---|------|
| G1 | Enable real-time, cross-language chat with high delivery reliability. |
| G2 | Provide accurate live translation + grammar feedback with minimal latency. |
| G3 | Make non-native text input (Japanese) accessible via a virtual keyboard. |
| G4 | Support media (image/file) sharing within conversations. |

### 2.2 Success Metrics (KPIs)
| Metric | Target |
|--------|--------|
| Live preview response latency (P95) | < 1.2s after debounce |
| Message delivery latency (real-time) | < 500ms |
| Translation accuracy (user-rated) | ≥ 90% "helpful" |
| Message send success rate | ≥ 99.5% |
| Daily active users retention (D7) | ≥ 30% |
| Debounce API-call reduction vs per-keystroke | ≥ 80% fewer calls |

---

## 3. System Architecture

### 3.1 High-Level Architecture
```
┌─────────────────┐      REST / WS       ┌──────────────────┐      API      ┌──────────────┐
│   Frontend      │ ───────────────────> │   Backend        │ ────────────> │  Gemini API  │
│  React + TW CSS │ <─────────────────── │  Node + Express  │ <──────────── │ (LLM)        │
└────────┬────────┘   translation/tips   └──────────────────┘  JSON result  └──────────────┘
         │
         │ Supabase JS SDK (Auth, DB, Realtime, Storage)
         ▼
┌───────────────────────────────────────────────────────────┐
│                        Supabase                            │
│  Auth  │  Postgres DB  │  Realtime Channels  │  Storage    │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack
| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Frontend | React.js + Tailwind CSS | UI, chat list, input box, keyboard popup, live preview card |
| Backend | Node.js + Express.js | Process live typing data, call Gemini API, return translation + grammar feedback |
| AI | Google Gemini API | Translation + grammar correction, returns structured JSON |
| Database | Supabase (Postgres) | User accounts, sessions, message & media persistence |
| Realtime | Supabase Realtime Channels | Point-to-point message delivery without page refresh |
| Storage | Supabase Storage Bucket | Image/file storage, generates URLs saved to message table |
| Auth | Supabase Auth | Email/username sign-up & login |

### 3.3 Component Responsibilities
- **Frontend:** Renders chat UI, manages debounce timer for typing, displays the live preview card, virtual keyboard, and media previews.
- **Backend:** Receives typed text, constructs the custom Gemini prompt, parses the JSON response, and returns translation + grammar tips. Keeps the Gemini API key server-side (never exposed to client).
- **Supabase:** Handles authentication, permanent storage of messages and media, and real-time delivery of new messages to the receiver.

---

## 4. Detailed Features

### 4.1 Feature: Live Typing Feedback & Translation (Live Translation & Grammar Preview)

**Priority:** P0 (Core differentiator)

**Description:** As the user types in Japanese (or any language), a dynamic card floats above the input field showing the meaning in the user's language (Bengali/English) and grammar tips.

**Requirements:**
- **Debouncing:** Instead of calling the API on every keystroke, the request is sent to the backend **300–500ms** after the user stops typing.
- **Live Card:** A dynamic card appears directly above the input field showing:
  - The Bengali/English meaning of the typed line.
  - If the sentence has an error or a better word choice exists, a short tip or the corrected form is shown.
- The card updates as typing continues (each debounce cycle).
- The card disappears when the input is cleared or a message is sent.

**Acceptance Criteria:**
- [ ] No API call fires while user is actively typing within the debounce window.
- [ ] Preview card appears within 1.2s (P95) of typing pause.
- [ ] Card shows translation and, when applicable, grammar/word-choice tips.
- [ ] Card is dismissed on send or clear.
- [ ] Graceful handling of API failure (card shows a subtle error/retry state, does not block typing).

---

### 4.2 Feature: Dynamic Keyboard & Language Selection (Dynamic Keyboard Layout)

**Priority:** P1

**Description:** A language toggle within the chat box and a virtual keyboard popup for Japanese input.

**Requirements:**
- **Language Switch:** A language toggle in the chat box (e.g., Bengali ↔ Japanese).
- **Virtual Keyboard Popup:** When Japanese is selected, a Hiragana/Katakana input layout appears at the bottom of the screen so users can input Japanese characters even without a Japanese keyboard.
- The selected input language influences the source language sent to the translation prompt.

**Acceptance Criteria:**
- [ ] Toggle switches active input language and updates preview behavior.
- [ ] Virtual keyboard appears/hides based on selected language.
- [ ] Hiragana and Katakana layouts are available and insert correct characters into the input.
- [ ] Keyboard is responsive and usable on mobile and desktop.

---

### 4.3 Feature: Incoming Message On-the-Spot Translation (Message Translation)

**Priority:** P0

**Description:** When the other party sends a message in Japanese, it can be translated into the user's language within the chat bubble.

**Requirements:**
- Each message bubble has a small **"Translate"** icon (below or beside the bubble).
- On click, the translated meaning appears under the message.
- If **Auto-Translate** setting is ON, incoming messages are translated automatically.
- Original text remains visible; translation is shown as supplementary text.

**Acceptance Criteria:**
- [ ] Translate icon present on messages in a foreign language.
- [ ] Clicking translates and displays meaning below the bubble.
- [ ] Auto-Translate setting toggles automatic translation of incoming messages.
- [ ] Translated text is cached to avoid re-translating the same message repeatedly.

---

### 4.4 Feature: Media Sharing System

**Priority:** P1

**Description:** Users can attach images or files to the chat.

**Requirements:**
- An attach button in the chat window to add image/file.
- File is first uploaded to **Supabase Storage Bucket**.
- The generated URL is saved in the message table.
- The chat renders a preview from the stored URL.

**Acceptance Criteria:**
- [ ] User can select and upload an image/file.
- [ ] File is stored in Supabase Storage with proper permissions.
- [ ] Generated URL is persisted in the message record.
- [ ] Chat bubble renders image preview / file link.
- [ ] Upload progress and failure states are handled.

---

## 5. Data Structure & Logical Flow

### 5.1 Entity Relationships

#### User / Profile Entity
| Field | Type | Description |
|-------|------|-------------|
| user_id | UUID (PK) | Unique user identifier |
| username | string | Display / login username |
| profile_picture | string (URL) | Avatar image URL |
| preferred_language | enum/string | Preferred primary language (e.g., `bn`, `ja`, `en`) |
| created_at | timestamp | Account creation time |

#### Message Entity
| Field | Type | Description |
|-------|------|-------------|
| message_id | UUID (PK) | Unique message identifier |
| sender_id | UUID (FK → user) | Sender |
| receiver_id | UUID (FK → user) | Receiver |
| original_text | text | Original message text |
| translated_text | text (nullable) | Translated text |
| source_language | string | Source language code |
| target_language | string | Target language code |
| media_url | string (nullable) | URL of attached media |
| created_at / timestamp | timestamp | Time sent |

**Relationships:**
- One User → many Messages (as sender).
- One User → many Messages (as receiver).

### 5.2 Messaging Flow

**Typing Phase (Live Preview):**
```
User Types
   ➔ Debounce Timeout (300–500ms)
   ➔ Node.js Server
   ➔ Gemini API
   ➔ Response with Translation & Grammar Fix (JSON)
   ➔ Show Live Preview Box
```

**Message Send Phase:**
```
User Hits Send
   ➔ Insert to Supabase Messages Table
   ➔ Supabase Realtime Trigger
   ➔ Receiver Screen Updates Instantly
```

### 5.3 Suggested Gemini Response Schema (JSON)
```json
{
  "translation": "translated meaning in target language",
  "has_correction": true,
  "corrected_text": "grammatically correct version",
  "tips": [
    "short tip about grammar or word choice"
  ],
  "source_language": "ja",
  "target_language": "bn"
}
```

---

## 6. API Specification (Backend REST)

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/api/translate/live` | Live typing translation + grammar tips | `{ text, sourceLang, targetLang }` | Gemini JSON schema (§5.3) |
| POST | `/api/translate/message` | Translate a specific message | `{ messageId or text, sourceLang, targetLang }` | `{ translation }` |
| GET | `/api/health` | Health check | — | `{ status: "ok" }` |

**Notes:**
- Gemini API key is stored as a server-side environment variable and never exposed to the client.
- Backend validates and sanitizes input length to control token cost.
- Consider rate limiting per user/IP on `/api/translate/live`.

---

## 7. Implementation Roadmap

### Phase 1: Backend & AI Integration (Node.js)
- Set up initial server environment with Node.js and Express.
- Integrate Gemini API with a custom prompt that returns translation + grammatical correctness directly in **JSON format**.
- Build REST API endpoints for client communication.

**Deliverables:** Working `/api/translate/live` and `/api/translate/message` endpoints returning structured JSON.

### Phase 2: Database, Authentication & File Storage (Supabase)
- Create Supabase project and tables for user profiles and messages.
- Set up email/username-based sign-up and login using Supabase Auth.
- Create a storage bucket for images/files and configure permissions.
- Enable real-time listener on the messages table.

**Deliverables:** Auth flow, DB schema, storage bucket, realtime enabled.

### Phase 3: Frontend UI Development (React.js)
- **WhatsApp-style Layout:** Chat list/contacts on the left, main chat interface on the right.
- **Language Switcher & Virtual Keyboard:** Language toggle widget + Japanese virtual keyboard component.
- **Live Preview Panel:** Responsive card above the input field for real-time translation + tips.

**Deliverables:** Functional UI wired to backend and Supabase.

### Phase 4: Message Sync & Media Sharing
- Use Supabase Realtime SDK to connect both sides of the chat for refresh-free messaging.
- Add logic to select, process, and upload images to storage, then render the URL in the chat bubble.

**Deliverables:** Real-time two-way chat + working media sharing.

### Phase 5: Testing & Polishing
- Test interface responsiveness and keyboard popup across mobile and desktop browsers.
- Check for lag during live translation processing and optimize the prompt.

**Deliverables:** Cross-browser tested, optimized, polished release candidate.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Live preview P95 < 1.2s; realtime delivery < 500ms |
| Scalability | Debouncing to minimize API calls; consider caching translations |
| Security | Gemini key server-side only; Supabase Row-Level Security (RLS) on messages |
| Privacy | Users can only read/write their own conversations |
| Reliability | Message send success ≥ 99.5%; graceful degradation on AI failure |
| Responsiveness | Full support for mobile and desktop viewports |
| Accessibility | Keyboard operable, sufficient contrast, ARIA labels on controls |

---

## 9. Security & Permissions

- **Authentication:** Supabase Auth (email/username).
- **Row-Level Security:** Messages readable/writable only by their `sender_id` / `receiver_id`.
- **Storage Permissions:** Bucket policies restrict uploads to authenticated users; media URLs scoped appropriately.
- **API Protection:** Server-side Gemini key, input validation, rate limiting.

---

## 10. Assumptions, Risks & Open Questions

### 10.1 Assumptions
- Primary language pair is Bengali ↔ Japanese, with English as an intermediate/optional.
- One-to-one (point-to-point) chat is the initial scope (group chat is future scope).

### 10.2 Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini latency causing laggy preview | High | Debounce, caching, prompt optimization |
| High API cost from frequent calls | Medium | Debounce ≥ 300ms, input length limits, rate limiting |
| Translation inaccuracy | Medium | Prompt tuning, user feedback loop |
| Virtual keyboard UX complexity | Medium | Iterative UX testing on mobile |

### 10.3 Open Questions
- Should group chats be supported in a later version?
- Do we need voice message / audio support?
- Which additional language pairs should be prioritized after Bengali ↔ Japanese?
- Should live preview history/logs be stored for improvement analytics?

---

## 11. Future Scope (Out of Scope for v1)
- Group chats.
- Voice/audio messages and voice translation.
- Additional language pairs beyond Bengali ↔ Japanese.
- Offline mode / message queuing.
- Read receipts, typing indicators, message reactions.

---

*End of Document*
