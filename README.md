# SlugMind — Ambient Student Co-pilot
> A Chrome extension that lives quietly in your browser and handles email drafts, calendar conflicts, smart reminders, focus timers, and to-do tracking — without ever breaking your flow.

---

## 🎯 Project Overview

SlugMind is a Manifest V3 Chrome extension + Vercel-deployed dashboard built for UCSC students. It watches your Gmail and Google Calendar in the background, takes action silently, and only taps you on the shoulder when something actually needs attention. Think Grammarly — but for your entire student workflow.

**Hackathon targets:**
- CruzHacks Best Overall Project
- CruzHacks Best Real World Impact
- Vercel Zero to Agent Prize (deployed dashboard at `/dashboard`)

---

## 🧠 AI Model Stack (All Free / Local)

| Feature | Model | Provider | Why |
|---|---|---|---|
| Email drafting & replies | `gemini-2.5-flash` | Google AI Studio (free) | Best free instruction-following for tone-matched text |
| Calendar conflict analysis | `gemini-2.5-flash` | Same API key as above | Reuse one key, one SDK, less complexity |
| Redundancy detection & reminders | `llama3.2:3b` via Ollama | Local (offline) | Zero API calls, runs on laptop, pattern detection doesn't need a big model |
| Focus timer, to-do logic | Vanilla JS | None | Pure logic — no AI needed |

### Why NOT OpenAI
OpenAI's API has **no free tier** — it requires a paid account with billing. Do not use it.

### Gemini Free Tier Limits (as of May 2026)
- `gemini-2.5-flash`: 10 RPM, 250 requests/day — plenty for ambient background usage
- API key from: https://aistudio.google.com (no credit card required)

### Ollama Setup (for redundancy detection)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model (3B is fast enough, runs on any laptop)
ollama pull llama3.2:3b

# Ollama runs locally at http://localhost:11434
```

---

## 🗂️ Project Structure

```
slugmind/
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background/
│   │   ├── service-worker.js   # Main background agent
│   │   ├── email-agent.js      # Gmail watching + draft logic
│   │   ├── calendar-agent.js   # Google Calendar conflict detection
│   │   ├── redundancy-agent.js # Ollama pattern detection
│   │   └── focus-agent.js      # Timer + to-do management
│   ├── content/
│   │   ├── gmail-injector.js   # Injects floating card into Gmail
│   │   └── toast.js            # Corner toast notifications
│   ├── popup/
│   │   ├── popup.html          # Extension toolbar popup
│   │   ├── popup.js
│   │   └── popup.css
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png        # Slug icon — green/yellow/red states
│
├── dashboard/                  # Vercel-deployed Next.js dashboard
│   ├── app/
│   │   ├── page.tsx            # Main dashboard (action history, settings)
│   │   ├── settings/page.tsx   # Configure auto-send rules, focus preferences
│   │   └── api/
│   │       ├── gemini/route.ts # Proxy Gemini API calls (keeps key server-side)
│   │       └── ollama/route.ts # Proxy to local Ollama (dev only)
│   ├── components/
│   │   ├── TodoList.tsx
│   │   ├── FocusTimer.tsx
│   │   ├── ActionLog.tsx
│   │   └── StatusDot.tsx
│   └── package.json
│
└── README.md
```

---

## ⚙️ Core Features & How to Build Each

### 1. 📧 Email Agent (`email-agent.js`)

**What it does:** Detects unread emails needing a reply, drafts a response using Gemini, shows a floating verification card in Gmail, and optionally auto-sends based on user rules.

**Build steps:**
1. Use Gmail API (`gmail.readonly` + `gmail.send` OAuth scopes) to watch inbox
2. Poll every 60 seconds in the service worker for unread threads
3. Send thread context to Gemini 2.5 Flash with this system prompt:
   ```
   You are a helpful student assistant. Draft a short, friendly reply to this email thread. 
   Match the tone of the conversation. Keep it under 100 words unless the topic demands more.
   Return ONLY the email body, no subject line, no preamble.
   ```
4. Inject a floating card into Gmail DOM via `gmail-injector.js` with:
   - Draft preview
   - ✅ Send | ✏️ Edit | ✕ Dismiss buttons
   - "Auto-send in 10s" countdown if auto-send mode is enabled

**Auto-send rules (configurable in dashboard):**
- "Auto-send replies to: [professor@ucsc.edu, ta@ucsc.edu]"
- "Always verify for: financial aid, housing, anything with 'grade'"

---

### 2. 📅 Calendar Watchdog (`calendar-agent.js`)

**What it does:** Monitors Google Calendar for new events and cross-checks for time conflicts. Fires a toast notification when a conflict is detected. Suggests 3 alternative times.

**Build steps:**
1. Use Google Calendar API (`calendar.readonly` scope) to fetch events for the next 7 days
2. On new event detection, check overlap with existing events
3. If conflict found, send both events to Gemini with prompt:
   ```
   A student has two overlapping calendar events. 
   Event A: [title, time, duration]
   Event B: [title, time, duration]
   Suggest 3 alternative times for Event B that don't conflict, 
   based on the student's existing calendar gaps. Return JSON array of {date, time, duration}.
   ```
4. Show toast in bottom-right corner with conflict details and alternative slots
5. One-click to draft a reschedule reply email

**Toast states:**
- 🔴 Red: Hard conflict (exact overlap)
- 🟡 Yellow: Near conflict (less than 15 min gap)
- 🟢 Green: No conflicts detected

---

### 3. 🔁 Redundancy Agent + Smart Reminders (`redundancy-agent.js`)

**What it does:** Learns repeated email/task patterns and converts them into scheduled reminders. Uses local Ollama so no API calls are needed.

**Build steps:**
1. Store a local action log in `chrome.storage.local` — every email sent, every task created
2. Every 24 hours, send the last 30 days of action log to Ollama llama3.2:3b:
   ```
   Here is a student's recent email/task history (JSON). 
   Identify any repeating patterns (same email type, same day/time, same recipient).
   Return JSON: [{pattern: string, suggestedReminder: string, cronTime: string}]
   ```
3. If a pattern is detected with 3+ repetitions, prompt user: 
   *"You've sent the same type of email to your TA 4 times on Thursdays — want me to remind you automatically?"*
4. On user approval, store the reminder and fire it via `chrome.alarms` API

**Smart reminder examples:**
- Every Wednesday at 8PM: "Reminder: submit weekly reflection to Canvas"
- Every Monday morning: "Did you check if office hours Zoom link was posted?"
- Before every CS class: "Your notes from last session are ready to review"

---

### 4. ⏱️ Focus OS (`focus-agent.js`)

**What it does:** Runs a Pomodoro-style focus timer that silences SlugMind during deep work, manages a 3-bucket to-do list, and shows an end-of-session review.

#### Focus Timer
**Build steps:**
1. Timer lives in the popup UI — 3 presets: 25 min (Pomodoro), 45 min (deep work), custom
2. On timer start:
   - Set `focusMode = true` in `chrome.storage.session`
   - All toast notifications suppressed
   - Extension icon turns solid purple
   - Badge shows countdown: `chrome.action.setBadgeText({text: "43m"})`
3. On timer end:
   - Show popup with session summary: "While you focused — 2 emails drafted, 1 conflict flagged"
   - Prompt to-do review
   - Extension icon returns to normal status dot color

#### To-Do List
**3 buckets — no more, no less:**
- ✅ **Today** — must finish this session
- ⚡ **Needs Attention** — overdue or blocked
- ➡️ **Tomorrow / Next Session** — planned or pushed

**Build steps:**
1. Store tasks in `chrome.storage.local` as JSON array with fields: `{id, title, bucket, dueDate, createdAt, completedAt}`
2. At end of each focus session, show review modal:
   - Checkboxes for each "Today" task
   - "Push to tomorrow" button per task
   - Any unfinished tasks auto-move to "Needs Attention" after 2 missed sessions
3. Smart bucket suggestions via Gemini (optional, only if API call budget allows):
   - Parse task title → suggest due date bucket based on urgency keywords
   - "Assignment due Friday" → auto-buckets to Today if it's Thursday

**Task lifecycle:**
```
[Created] → [Today] → [Completed ✓]
                    ↘ [Needs Attention] → [Tomorrow] → loop
```

---

## 🔴 Extension Status Dot (icon states)

Implement by switching between 3 icon sets in `manifest.json` using `chrome.action.setIcon()`:

| State | Color | Meaning |
|---|---|---|
| 🟢 Green | All clear | No pending actions |
| 🟡 Yellow | Has suggestions | Actions queued, no urgency |
| 🔴 Red | Needs attention | Conflict detected or overdue task |

During focus mode: icon turns solid **purple** with a timer badge.

---

## 🔐 Auth & Permissions

### manifest.json permissions needed:
```json
{
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "identity",
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "https://mail.google.com/*",
    "https://www.googleapis.com/*",
    "https://generativelanguage.googleapis.com/*"
  ]
}
```

### OAuth Scopes (Google):
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/calendar.readonly
```

Use `chrome.identity.getAuthToken()` for OAuth — built into Chrome, no extra auth library needed.

---

## 🌐 Vercel Dashboard

The dashboard is a Next.js app deployed on Vercel. It serves two purposes:
1. **Settings panel** — configure auto-send rules, focus preferences, reminder schedules
2. **Vercel prize submission URL** — this is the deployed URL you submit

### Key pages:
- `/` — Action history log (what SlugMind did today)
- `/settings` — Auto-send rules, focus timer presets, notification preferences
- `/todo` — Full to-do list view with drag-and-drop bucket management
- `/api/gemini` — Server-side proxy for Gemini API (keeps API key out of extension)

### Deploy:
```bash
cd dashboard
npm install
vercel deploy
```

---

## 🚀 Build Order for Hackathon (Solo, 8–10 hours)

Follow this order to always have a demoable product:

### Hour 1-2: Extension shell + Auth
- [ ] `manifest.json` with all permissions
- [ ] Google OAuth working via `chrome.identity.getAuthToken()`
- [ ] Popup UI with status dot (hardcoded green for now)
- [ ] Verify Gmail API and Calendar API calls return data

### Hour 2-3: Calendar Watchdog (fastest win)
- [ ] Fetch events for next 7 days
- [ ] Basic conflict detection logic (pure JS, no AI yet)
- [ ] Toast notification fires on conflict
- [ ] Wire in Gemini for alternative time suggestions

### Hour 3-5: Email Agent
- [ ] Fetch latest unread emails
- [ ] Send to Gemini, get draft back
- [ ] Inject floating card into Gmail DOM
- [ ] Verify + Send flow working

### Hour 5-6: Focus Timer + To-Do
- [ ] Timer in popup with 3 presets
- [ ] `chrome.action.setBadgeText` countdown
- [ ] To-do list in popup with 3 buckets
- [ ] End-of-session review modal

### Hour 6-7: Redundancy / Reminders
- [ ] Action log in `chrome.storage.local`
- [ ] `chrome.alarms` for scheduled reminders
- [ ] Ollama call for pattern detection (if time allows — otherwise hardcode 2 demo patterns)

### Hour 7-8: Vercel Dashboard
- [ ] Next.js app with settings page
- [ ] Deploy to Vercel, get live URL
- [ ] Connect extension to save/load settings from dashboard API

### Hour 8+: Polish
- [ ] Status dot color logic
- [ ] Focus mode silences all toasts
- [ ] End-of-session summary card
- [ ] Record demo video for Vercel short-form content prize

---

## 🎬 Demo Script (4 minutes for judges)

1. **Morning scenario** (30s): Open Gmail → SlugMind detects unread professor email → floating card appears with AI draft → one click send ✅
2. **Conflict alert** (45s): Accept a fake Google Meet invite → toast fires immediately: "⚠️ Conflicts with CS101 at 2PM — here are 3 alternative times" → one click to reschedule
3. **Focus session** (60s): Click extension → start 25-min focus timer → icon turns purple with badge → show that toasts are suppressed → end timer early → review card appears showing what SlugMind handled
4. **To-do review** (45s): Show 3-bucket to-do list → check off completed tasks → push one to tomorrow → one overdue task auto-moves to "Needs Attention"
5. **Smart reminder** (30s): Show reminder card: "You've done this 4 times — want me to remind you every Thursday?" → one click approve
6. **Dashboard** (30s): Open Vercel URL → show action history + settings panel

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, Vanilla JS |
| UI (popup + cards) | HTML/CSS, no framework (keeps bundle tiny) |
| Dashboard | Next.js 14, Tailwind CSS |
| Hosting | Vercel (required for Vercel prize) |
| Email AI | Gemini 2.5 Flash via Google AI Studio (free) |
| Calendar AI | Gemini 2.5 Flash (same key) |
| Pattern AI | Ollama llama3.2:3b (local, offline) |
| Auth | Google OAuth via `chrome.identity` |
| Storage | `chrome.storage.local` + `chrome.storage.session` |
| Scheduling | `chrome.alarms` API |

---

## 🔑 Environment Variables (dashboard/.env.local)

```bash
GEMINI_API_KEY=your_key_from_aistudio.google.com
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
NEXT_PUBLIC_EXTENSION_ID=your_extension_id_after_loading_unpacked
```

> ⚠️ Never put GEMINI_API_KEY in the extension itself. Always proxy through the Vercel API route.

---

## 📦 Getting Started

```bash
# 1. Clone and install dashboard deps
cd dashboard && npm install

# 2. Add your .env.local (see above)

# 3. Run dashboard locally
npm run dev

# 4. Load extension in Chrome
# Go to chrome://extensions → Enable Developer Mode → Load Unpacked → select /extension folder

# 5. Start Ollama for local pattern detection
ollama serve &
ollama pull llama3.2:3b

# 6. Deploy dashboard to Vercel
vercel deploy --prod
```

---

## 🏆 Prize Track Alignment

| Track | How SlugMind qualifies |
|---|---|
| **Best Overall** | Multi-API agent, clean ambient UX, solves a real daily problem, full demo story |
| **Best Real World Impact** | Saves students hours/week on email overhead, prevents scheduling disasters, protects focus time |
| **Vercel Zero to Agent** | Deployed Next.js dashboard on Vercel, AI agent with real-world applicability, creative/original |
| **Vercel Short-Form Content** | Record a 60s TikTok/Reel of the live demo during build — show the focus timer + email card |

---

*Built for CruzHacks 2026 — Go Slugs! 🐌*
