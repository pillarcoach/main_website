# Pillar MVP — Full Context Document

## What This App Is

Pillar is a real-time personal training web app. A coach streams a session to a client over WebRTC. The coach sends live feedback (reps, set start/end, voice cues), and the client sees their own camera feed, a rep counter, a timer, and hears ElevenLabs TTS audio feedback. Everything syncs through Firebase Firestore.

**Live URL:** https://webrtc-firebase-demo-orcin.vercel.app  
**Stack:** Vite (multi-page), vanilla JS (no framework), Firebase v8, WebRTC, ElevenLabs TTS, Vercel serverless functions

---

## Page Map

| URL | HTML file | JS file | Who uses it |
|-----|-----------|---------|-------------|
| `/` | `index.html` | `src/main.js` | Landing — links to coach or client entry |
| `/coach.html` | `coach.html` | `src/coach.js` | Coach entry — choose "Start" or "Join" |
| `/coach-stream.html` | `coach-stream.html` | `src/coach-stream.js` | **Coach live dashboard** — WebRTC, set control, rep count |
| `/coach-feedback.html` | `coach-feedback.html` | `src/coach-feedback.js` | **Coach feedback panel** — sends TTS cues, tracks sets |
| `/client.html` | `client.html` | `src/client-join.js` | Client join key entry (6-char code) |
| `/client-workout.html` | `client-workout.html` | `src/client-workout.js` | Client drag-to-reorder exercise flow |
| `/client-session.html` | `client-session.html` | `src/client-session.js` | **Client live feed** — camera, rep counter, TTS audio |
| `/summary.html` | `summary.html` | `src/summary.js` | Session summary after workout ends |

---

## User Flows

### Coach flow
1. Opens `/coach.html` → clicks "Start New Session" or "Join Existing"
2. `coach-stream.html` — selects exercise **category** (Push / Pull / Legs), starts session → Firestore `calls/{joinKey}` is created with an SDP offer
3. Shares the 6-char `joinKey` with the client
4. `coach-feedback.html` joins the same session via the join key — this is a second browser tab/window on the coach's device
5. Stream coach sees the client's camera feed (WebRTC), controls sets (Start Set / End Set), adjusts rep count
6. Feedback coach sends pre-written feedback cues → client hears them via TTS

### Client flow
1. Opens `/client.html` → enters 6-char join key
2. Redirected to `/client-workout.html?joinKey=XXX` — sees only exercises filtered by the coach's chosen category, drag-reorders them, taps Continue
3. Redirected to `/client-session.html?joinKey=XXX&exercise=YYY` — camera starts, WebRTC connects to coach
4. On load: prompted to "Set Cam" (notifies coach to check angle)
5. During session: hears TTS audio on set start/end/feedback, sees rep count and elapsed timer, can switch exercise via "Next Exercise" button or three-dot menu
6. On session end: redirected to `/summary.html`

---

## Firebase / Firestore Schema

### `calls/{joinKey}` — WebRTC signaling + live session state

| Field | Type | Set by | Purpose |
|-------|------|--------|---------|
| `offer` | `{sdp, type}` | coach-stream | SDP offer for WebRTC |
| `answer` | `{sdp, type}` | client-session | SDP answer |
| `signalingVersion` | number | coach-stream | Incremented on each reconnect |
| `answerVersion` | number | client-session | Must match `signalingVersion` |
| `reconnectRequestedAt` | timestamp | client-session | Client writes on reload to trigger coach reconnect |
| `exerciseCategory` | string (`push`/`pull`/`legs`) | coach-stream | Filters client exercise list |
| `currentExercise` | string (display name e.g. `"Lat Pulldown"`) | coach-stream or client-session | Currently active exercise |
| `clientExerciseOrder` | string[] (exercise IDs) | client-session | Client's chosen exercise order; coach can read and switch |
| `repCount` | number | coach-stream | Current rep count |
| `setStatus` | `"started"` \| `"ended"` | coach-feedback | Triggers client timer + TTS |
| `setStatusUpdated` | timestamp | coach-feedback | Deduplication for setStatus changes |
| `setSummary` | object | coach-feedback | Data sent at set end |
| `camSetRequest` | timestamp | client-session | Client taps "Set Cam" → coach gets notified |
| `camStatus` | `"pending"` \| `"set"` \| `"not-set"` | coach-stream | Coach approves/rejects client camera angle |
| `exerciseUpdated` | timestamp | coach-stream | When coach changes exercise |

#### Subcollections of `calls/{joinKey}`
- `offerCandidates/` — coach ICE candidates (have `version` field)
- `answerCandidates/` — client ICE candidates (have `version` field)
- `coaches/` — active coach instances (stream + feedback coaches register here)
- `feedback/` — TTS feedback messages sent by coach-feedback to client

### `sessions/{joinKey}` — Persistent session record

| Field | Purpose |
|-------|---------|
| `status` | `"ACTIVE"` / `"ENDED"` |
| `startTime` | Timestamp |
| `endTime` | Timestamp |
| `exerciseCategory` | Coach's chosen category |
| `coachId` | Coach identifier |

#### Subcollection: `sessions/{joinKey}/exerciseSets/{setId}`
Each completed set is written here with: `exercise`, `repCount`, `duration`, `startTime`, `endTime`, `feedback[]`

---

## Exercises

Seven total, grouped by category:

| ID | Display Name | Category |
|----|-------------|----------|
| `bench-press` | Bench Press | push |
| `incline-dumbbell` | Incline Dumbbell | push |
| `shoulder-press` | Shoulder Press | push |
| `lat-pulldown` | Lat Pulldown | pull |
| `deadlift` | Deadlift | pull |
| `barbell-rows` | Barbell Rows | pull |
| `squats` | Squats | legs |

Coach selects category → client only sees that category's exercises on the workout ordering page.

---

## WebRTC Architecture

- Coach is the **offerer** (creates offer, waits for answer)
- Client is the **answerer** (receives offer, sends answer)
- Coach only **receives** video (recvonly transceiver) — coach has no camera
- Client **sends** video only — no audio track
- Single `pc` on each side for the stream coach ↔ client connection
- `pc2` exists on the client side for a second coach connection (feedback coach also gets video)

### Reconnect flow (client reloads)
1. Client page loads, reads `callData` — if `answer` already exists, it means the client reconnected
2. Client writes `reconnectRequestedAt` timestamp to Firestore
3. Coach sees it in `onSnapshot`, calls `refreshClientConnection()`:
   - Closes old `pc`, creates new one via `initPeerConnection()`
   - Sets `remoteVideo.srcObject` to new empty `MediaStream`
   - Calls `publishOffer(signalingVersion + 1)` — increments version, deletes old answer/answerVersion/reconnectRequestedAt from Firestore
4. Client's `waitForFreshOffer()` resolves when it sees the new `signalingVersion`
5. Client creates answer, writes it with matching `answerVersion`
6. Coach `onSnapshot` sees answer — applies it only if `pc.signalingState === 'have-local-offer'` AND `answerVersion === currentSignalingVersion`

---

## TTS (ElevenLabs)

- **Vercel serverless function:** `api/tts.js` — proxies to ElevenLabs API, returns base64 MP3
- **Local dev:** Vite plugin in `vite.config.js` intercepts `/api/tts` and calls ElevenLabs directly
- **Client playback:** `speakFeedback(message)` in `client-session.js`
  - On iOS: creates a **fresh `AudioContext`** per call (reusing one fails — iOS suspends it between gestures)
  - On other platforms: reuses a single `AudioContext`
  - Falls back to browser `speechSynthesis` if TTS fetch fails
  - Audio unlock: first `touchstart`/`click` creates and plays a silent `<audio>` element to unlock iOS audio pipeline
- **Voice:** ElevenLabs voice ID `6Hu6SxxVMKGbhFGr2u0a`, model `eleven_turbo_v2`
- **Env vars needed:** `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (in `.env.local` and Vercel project settings)

---

## Key UI Patterns

### Dark bottom sheet (used everywhere for overlays)
CSS classes: `.lf-end-overlay` (full-screen dim) + `.lf-end-sheet` (card slides up from bottom)  
Used for: Leave confirmation, camera setup prompt, camera notify, utility menu, status messages, exercise picker

### Client live feed layout (`client-session.html`)
- Top bar: Pillar logo | Set Cam button (red/green dot) | LIVE indicator
- Full-screen local video behind everything
- Bottom card: exercise name + elapsed timer, rep count + sparkline, three-dot menu + "Next Exercise" button
- "Next Exercise" button opens exercise picker sheet directly
- Three-dot menu contains: See Summary, Go to another exercise, Leave session (red)

### Coach stream dashboard (`coach-stream.html`)
- Persistent camera bar at top showing client cam status — "Camera Not Set" / "Camera OK ✓" buttons
- Client's flow panel showing exercise order (clickable to switch exercise)
- Exercise select dropdown (coach changes exercise → syncs to client via Firestore)
- Start Set / End Set buttons, rep counter +/−
- Session history panel below

---

## Build & Deploy

```bash
# Local dev
npm run dev          # http://localhost:5173

# Deploy to production
vercel --prod
```

**Vite config:** Multi-page build — all 8 HTML files are entry points in `vite.config.js` `rollupOptions.input`.  
**Vercel config:** `vercel.json` has rewrites for each HTML page + `/api/(.*)` passthrough. No `functions` block (Vercel auto-detects `api/` directory).  
**Node version:** `"engines": { "node": "20.x" }` in `package.json` (required for Vercel to use Node 20).

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ELEVENLABS_API_KEY` | `.env.local` + Vercel | ElevenLabs TTS API key |
| `ELEVENLABS_VOICE_ID` | `.env.local` + Vercel | Voice ID for TTS |

---

## Known Gotchas

- **iOS TTS:** Must use fresh `AudioContext` per playback call. Reusing a suspended context fails silently. The `<Audio>` element unlock approach is used for the initial gesture unlock.
- **Reconnect version mismatch:** Answer must only be applied when `pc.signalingState === 'have-local-offer'`. Using `!pc.currentRemoteDescription` as the guard was unreliable on reconnect.
- **Remote tracks:** Do NOT call `track.stop()` on remote WebRTC tracks — they belong to the peer. Just null out the reference.
- **Exercise select on coach:** The `<select>` element must have a `change` listener that writes `currentExercise` to Firestore. Do not set `disabled = true` on it.
- **Camera popup deduplication:** `lastSeenCamStatus` variable prevents the camera sheet from re-triggering on every Firestore snapshot — only fires when `camStatus` actually changes value.
- **Feedback coach exercise lookup:** The `nameToValue` map must include all 7 exercises. A partial map causes "Waiting for exercise" even when an exercise is active.
