# TwinMind Live

A web app that listens to your mic during a meeting and shows you 3 useful suggestions every 30 seconds — things like follow-up questions to ask, facts to verify, or talking points you haven't raised yet. Click any suggestion to get a detailed answer. You can also type questions directly into the chat panel.

Built as part of a TwinMind engineering assignment.

## Live Demo
[Insert Vercel URL here]

## Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/ashritkvs/twinmind-live.git
cd twinmind-live
npm install
npm run dev
```

Open `http://localhost:3000`, click Settings, paste your Groq API key, and hit Start.

## Stack

- **Next.js + TypeScript** — straightforward structure, deploys to Vercel in one command
- **Tailwind CSS** — fast to style, no separate CSS files to manage
- **Groq Whisper Large V3** — transcription, as required
- **Groq GPT-OSS 120B** — suggestions and chat, as required
- **MediaRecorder API** — built into the browser, no extra libraries needed
- **Vercel** — deployment

## How the app works

Every 30 seconds, the MediaRecorder stops the current audio chunk and starts a new one. That chunk gets sent to Whisper for transcription and the text gets appended to the left panel. Right after that, the recent transcript is sent to GPT-OSS 120B to generate 3 suggestion cards. New batches stack at the top, older ones stay visible below.

Clicking a suggestion sends it to the chat panel with the full transcript as context and streams back a detailed answer. You can also just type a question directly.

## Prompt decisions

This is the part I spent the most time on.

The suggestion prompt passes the last 30 lines of transcript to the model. I landed on 30 because it is enough to understand what is currently being discussed without drowning the model in earlier context that is no longer relevant.

The prompt tells the model to pick from 5 suggestion types — QUESTION, FACT_CHECK, TALKING_POINT, CLARIFICATION, and ANSWER. The key instruction is that it has to pick the right type based on what is actually happening right now. If someone just asked a question, surface an ANSWER. If a factual claim was just made, surface a FACT_CHECK. The model should never generate a suggestion that could apply to any conversation — it has to reference something specific that was actually said.

Previews are capped at 12 words. The goal is that the preview alone should be useful enough that you don't need to click it.

For chat, I pass the last 100 lines as context — more than suggestions because the user might ask about something from earlier in the conversation.

I use `reasoning_effort: "medium"` on GPT-OSS 120B. Without it the model tends to default to the same suggestion type repeatedly. With reasoning enabled it actually thinks about what kind of suggestion makes sense at that moment.

For the detailed answer prompt (when you click a card), I pass both the full transcript and the specific suggestion so the model knows exactly what to expand on.

## Tradeoffs

**30-second chunks** — the assignment specifies this. I kept it at 30 seconds rather than shorter because Whisper performs better with more audio. Very short chunks produce patchy transcriptions.

**All API calls from the browser** — there is no backend server. This works fine here because each user supplies their own API key. For a real product you would want a backend to keep keys secure.

**No persistence** — everything lives in memory. The assignment says this is fine, and it keeps the architecture simple.

## Export

The Export button downloads a JSON file with the full transcript, every suggestion batch with timestamps, and the full chat history. This appears in the header once you have started recording or sent a message.

## Folder structure

```
app/
  page.tsx               # ties everything together, all the main logic lives here
  layout.tsx
  globals.css
components/
  TranscriptPanel.tsx    # left column
  SuggestionsPanel.tsx   # middle column
  ChatPanel.tsx          # right column
  SettingsModal.tsx      # settings overlay
lib/
  groq.ts                # all Groq API calls
  settings.ts            # settings types, defaults, localStorage
```