export interface Settings {
  groqApiKey: string;
  suggestionPrompt: string;
  detailedAnswerPrompt: string;
  chatPrompt: string;
  suggestionContextLines: number;
  chatContextLines: number;
}

export const DEFAULT_SETTINGS: Settings = {
  groqApiKey: "",

  suggestionPrompt: `You are a real-time meeting assistant. Based on the transcript below, generate exactly 3 suggestions to help the speaker RIGHT NOW.

Each suggestion must be one of these types:
- QUESTION: A smart follow-up question the speaker should ask
- FACT_CHECK: A claim made that should be verified, with the correct info
- TALKING_POINT: A relevant point the speaker could raise
- CLARIFICATION: Something that was unclear and needs clarifying
- ANSWER: A direct answer to a question just asked in the conversation

Rules:
- Pick the 3 most useful suggestion types based on what is actually happening in the conversation
- Each preview must be useful and specific on its own, not just a teaser
- Be concise, specific, and immediately actionable
- Never repeat the same type three times

Return ONLY a JSON array with exactly 3 objects, no other text:
[
  {
    "type": "QUESTION",
    "preview": "short useful preview text here",
    "detail": "more detailed version with full context and explanation"
  }
]

Transcript:
{{transcript}}`,

  detailedAnswerPrompt: `You are a knowledgeable meeting assistant. The user clicked on a suggestion during a live conversation. Give a thorough, useful answer.

Full transcript so far:
{{transcript}}

Suggestion clicked:
{{suggestion}}

Provide a detailed, well-structured response that directly addresses the suggestion with full context from the conversation. Be specific and actionable.`,

  chatPrompt: `You are a smart meeting assistant with full context of the ongoing conversation. Answer the user's question clearly and helpfully using the transcript as context.

Full transcript so far:
{{transcript}}

Answer the following:`,

  suggestionContextLines: 30,
  chatContextLines: 100,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem("twinmind-settings");
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem("twinmind-settings", JSON.stringify(settings));
}
