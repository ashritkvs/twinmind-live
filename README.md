# TwinMind Live

A real-time meeting copilot that listens to your mic, transcribes what's being said, and shows you 3 useful suggestions every 30 seconds. Click any suggestion to get a detailed answer. You can also type questions directly into the chat.

Built as a TwinMind engineering assignment.

## Live Demo
https://twinmind-live-taupe.vercel.app/

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/ashritkvs/twinmind-live.git
cd twinmind-live
npm install
npm run dev
```

Open `http://localhost:3000`, click Settings in the top right, paste your Groq API key, and hit Start.

## Stack

- **Next.js + TypeScript** — clean structure, easy Vercel deployment
- **Tailwind CSS** — fast to build with, no separate CSS files to manage
- **Groq Whisper Large V3** — transcription, as required
- **Groq GPT-OSS 120B** — suggestions and chat, as required
- **MediaRecorder API** — built into the browser, no extra libraries needed
- **react-markdown** — renders formatted chat responses properly
- **Vercel** — deployment

## How it works

Every 30 seconds, the MediaRecorder stops the current audio chunk and starts a new one. That chunk goes to Groq Whisper for transcription and the text gets appended to the left panel. Right after transcription completes, the recent transcript is sent to GPT-OSS 120B to generate 3 suggestion cards. New batches stack at the top, older ones stay visible below faded out.

Clicking a suggestion sends it to the chat panel with transcript context and streams back a detailed answer token by token. You can also type any question directly into the chat.

## Prompt strategy

This is what I spent the most time on.

### Live suggestions

The suggestion prompt passes the last 30 lines of transcript to the model. I landed on 30 after testing — it's enough to understand what's currently being discussed without feeding the model earlier context that's no longer relevant.

The model picks from 5 suggestion types:
- **QUESTION** — something worth asking next to move the conversation forward
- **FACT_CHECK** — a specific claim that should be verified
- **TALKING_POINT** — a relevant angle or example not yet mentioned
- **CLARIFICATION** — something just said that's vague or unclear
- **ANSWER** — a direct response to a question just asked

The part I care most about is the decision logic. The model doesn't randomly pick types — it's told to read the situation. If someone just asked a question, surface an ANSWER. If a factual claim was made, surface a FACT_CHECK. If the conversation is one-sided, surface a QUESTION. This is what makes suggestions feel useful rather than generic.

Previews are capped at 12 words. The goal is that the preview alone should be useful enough that you don't need to click it.

I also tell the model to scan previous batches and not repeat themes. Without this, the same suggestion kept appearing across multiple batches when the conversation didn't change much.

### Detailed answers on click

When a card is clicked, a separate prompt fires with the last 50 lines of transcript and the specific suggestion as context. The response style adapts based on suggestion type — a FACT_CHECK gets a precise verification response, a TALKING_POINT gets a strong usable phrasing, an ANSWER gets a direct response first then expands.

I kept detailed answer context at 50 lines — more than suggestions because the user might click something that references an earlier part of the conversation, but focused enough to stay relevant.

### Chat

Chat passes the last 100 lines as context. More than suggestions because the user might ask about something from earlier in the session. The prompt also tells the model to read the situation first — is this a technical discussion, an interview, a brainstorm? — and match its tone accordingly.

### Model configuration

I use `reasoning_effort: "low"` for suggestions and `"medium"` for chat. Low keeps suggestion latency tight since they're generated every 30 seconds. Medium gives chat responses more depth when the user is waiting for a real answer.

## Architecture decisions

**All API calls happen in the browser** — no backend server. This works because each user supplies their own Groq API key. For a production app you'd want a backend to keep keys secure, but for this use case it keeps things simple and removes server latency.

**Suggestions trigger right after transcription** — rather than running on a separate 30-second timer, suggestions fire immediately after each transcript chunk completes. This means transcript and suggestions always arrive together instead of being offset by another 30 seconds.

**Separate context windows for everything** — suggestions, detailed answers, and chat each have their own configurable context size. Using one context for everything either gave suggestions too much noise or gave chat too little history.

**No persistence** — everything lives in memory. The assignment says this is fine and it keeps the code simple.

## Things the assignment left open

A few decisions the document didn't specify that I made calls on:

**Whose side the chat is on** — the app doesn't assume who the user is. It could be an interviewer, an interviewee, someone in a meeting. The chat prompt reads the situation from the transcript and responds accordingly.

**Suggestion timing** — I trigger suggestions immediately after each transcript chunk rather than on a separate timer. Transcript and suggestions always arrive at the same time.

**Reasoning effort** — the document specifies the model but not how to configure it. I chose low for suggestions and medium for chat after testing both.

## Settings

All prompts and context window sizes are editable in the settings screen. The defaults are hardcoded with values I found worked best through testing:

| Setting | Default | Reason |
|---|---|---|
| Suggestion context | 30 lines | Recent enough to be relevant, not too noisy |
| Detailed answer context | 50 lines | More history for clicked suggestions |
| Chat context | 100 lines | Full session for open-ended questions |

## Export

The Export button appears in the header once you've started recording or sent a message. Downloads a JSON file with the full transcript, every suggestion batch with timestamps, and the full chat history.

## Error handling

- Wrong API key → red toast with a clear message
- Mic permission denied → clear error explaining what to do
- API call fails mid-session → error toast, empty assistant message removed
- All errors auto-dismiss after 5 seconds

## Folder structure

```
app/
  page.tsx               # main logic — mic, transcription, suggestions, chat, export
  layout.tsx
  globals.css
components/
  TranscriptPanel.tsx    # left column — mic button, IDLE/RECORDING status, transcript
  SuggestionsPanel.tsx   # middle column — suggestion cards, auto-refresh countdown
  ChatPanel.tsx          # right column — chat with markdown rendering
  SettingsModal.tsx      # settings overlay — API key, prompts, context windows
lib/
  groq.ts                # all Groq API calls — transcription, suggestions, streaming chat
  settings.ts            # settings interface, defaults, localStorage helpers
```
