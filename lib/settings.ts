export interface Settings {
  groqApiKey: string;
  suggestionPrompt: string;
  detailedAnswerPrompt: string;
  chatPrompt: string;
  suggestionContextLines: number;
  detailedAnswerContextLines: number;
  chatContextLines: number;
}

export const DEFAULT_SETTINGS: Settings = {
  groqApiKey: "",

  suggestionPrompt: `You are a real-time meeting assistant. Based on the transcript below, generate exactly 3 suggestions to help the speaker RIGHT NOW.

Each suggestion must be one of these types:
- QUESTION: A smart follow-up question the speaker should ask next
- FACT_CHECK: A specific factual claim that was just made that should be verified
- TALKING_POINT: A specific angle or example the speaker hasn't mentioned yet but should
- CLARIFICATION: A specific term or statement that was unclear and needs explaining
- ANSWER: A direct answer to a question just asked in the last few lines

Rules:
- Read the MOST RECENT lines of the transcript carefully — suggestions must be relevant to what was JUST said, not the overall topic
- Each suggestion must reference something SPECIFIC from the transcript — a name, claim, example, or statement
- Never generate a suggestion that could apply to any conversation — be hyper-specific
- Vary the types — do not repeat the same type twice in one batch
- Keep previews SHORT and punchy — maximum 12 words
- The preview alone must deliver real value without needing to click
- Never repeat a suggestion that appeared in a previous batch

Return ONLY a JSON array with exactly 3 objects, no other text:
[
  {
    "type": "QUESTION",
    "preview": "short punchy preview under 12 words",
    "detail": "detailed explanation with full context and actionable insight"
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
  detailedAnswerContextLines: 50,
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