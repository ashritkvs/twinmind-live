"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Settings } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import TranscriptPanel from "@/components/TranscriptPanel";
import SuggestionsPanel, { SuggestionBatch, Suggestion } from "@/components/SuggestionsPanel";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import { transcribeAudio, generateSuggestions, streamChatResponse, getErrorMessage } from "@/lib/groq";
import { loadSettings } from "@/lib/settings";

const CHUNK_INTERVAL_MS = 30000;

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [batches, setBatches] = useState<SuggestionBatch[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<string[]>([]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  function showError(msg: string) {
    setError(msg);
    console.error(msg);
  }

  async function processAudioChunk(blob: Blob) {
    const settings = loadSettings();
    if (!settings.groqApiKey) return;
    if (blob.size < 1000) return;

    try {
      const text = await transcribeAudio(blob, settings.groqApiKey);
      if (text.trim()) {
        const updatedTranscript = [...transcriptRef.current, text.trim()];
        transcriptRef.current = updatedTranscript;
        setTranscript(updatedTranscript);
        refreshSuggestions();
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes("401") || msg.includes("invalid_api_key")) {
        showError("Invalid Groq API key. Please check your key in Settings.");
      } else {
        showError(`Transcription error: ${msg}`);
      }
    }
  }

  const refreshSuggestions = useCallback(async () => {
    const settings = loadSettings();
    if (!settings.groqApiKey) {
      showError("Please add your Groq API key in Settings first.");
      return;
    }

    const lines = transcriptRef.current;
    if (lines.length === 0) return;

    setIsRefreshing(true);

    try {
      const context = lines
        .slice(-settings.suggestionContextLines)
        .join("\n");

      const prompt = settings.suggestionPrompt.replace(
        "{{transcript}}",
        context
      );

      const suggestions = await generateSuggestions(prompt, settings.groqApiKey);

      const batch: SuggestionBatch = {
        timestamp: new Date().toISOString(),
        suggestions,
      };

      setBatches((prev) => [batch, ...prev]);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes("401") || msg.includes("invalid_api_key")) {
        showError("Invalid Groq API key. Please check your key in Settings.");
      } else {
        showError(`Failed to generate suggestions: ${msg}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  async function handleStartStop() {
    if (isRecording) {
      chunkTimerRef.current && clearInterval(chunkTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const settings = loadSettings();
      if (!settings.groqApiKey) {
        showError("Please add your Groq API key in Settings first.");
        setShowSettings(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        function createRecorder() {
          const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
          mediaRecorderRef.current = mr;

          mr.ondataavailable = (e) => {
            if (e.data.size > 0) {
              processAudioChunk(e.data);
            }
          };

          mr.start();
          return mr;
        }

        createRecorder();
        setIsRecording(true);

        chunkTimerRef.current = setInterval(() => {
          const mr = mediaRecorderRef.current;
          if (mr && mr.state !== "inactive") {
            mr.stop();
          }
          createRecorder();
        }, CHUNK_INTERVAL_MS);

      } catch (err) {
        const msg = getErrorMessage(err);
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          showError("Microphone access denied. Please allow mic permissions in your browser.");
        } else {
          showError(`Could not start recording: ${msg}`);
        }
      }
    }
  }

  async function handleSendMessage(userMessage: string) {
    const settings = loadSettings();
    if (!settings.groqApiKey) {
      showError("Please add your Groq API key in Settings.");
      return;
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setPendingSuggestion(null);

    const context = transcriptRef.current
      .slice(-settings.chatContextLines)
      .join("\n");

    const systemPrompt = settings.chatPrompt.replace("{{transcript}}", context);

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    try {
      for await (const token of streamChatResponse(
        systemPrompt,
        userMessage,
        settings.groqApiKey
      )) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes("401") || msg.includes("invalid_api_key")) {
        showError("Invalid Groq API key. Please check your key in Settings.");
      } else {
        showError(`Chat error: ${msg}`);
      }
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1].content === "") {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSuggestionClick(suggestion: Suggestion) {
    const settings = loadSettings();
    if (!settings.groqApiKey) {
      showError("Please add your Groq API key in Settings.");
      return;
    }

    const context = transcriptRef.current
      .slice(-settings.detailedAnswerContextLines)
      .join("\n");

    const prompt = settings.detailedAnswerPrompt
      .replace("{{transcript}}", context)
      .replace("{{suggestion}}", suggestion.preview);

    setPendingSuggestion(suggestion);
    await handleSendMessage(suggestion.preview);
  }

  function handleExport() {
    const data = {
      exportedAt: new Date().toISOString(),
      transcript,
      suggestionBatches: batches,
      chat: messages,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twinmind-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-bold text-white">TwinMind Live</h1>
        <div className="flex items-center gap-4">
          {(transcript.length > 0 || messages.length > 0) && (
            <button
              onClick={handleExport}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Export
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm max-w-md text-center">
          {error}
        </div>
      )}

      {/* 3 Columns */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-gray-800 overflow-hidden">
          <TranscriptPanel
            transcript={transcript}
            isRecording={isRecording}
            onStartStop={handleStartStop}
            onRefresh={refreshSuggestions}
            isRefreshing={isRefreshing}
          />
        </div>
        <div className="w-1/3 border-r border-gray-800 overflow-hidden">
          <SuggestionsPanel
            batches={batches}
            onSuggestionClick={handleSuggestionClick}
            isRefreshing={isRefreshing}
            onRefresh={refreshSuggestions}
            isRecording={isRecording}
          />
        </div>
        <div className="w-1/3 overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            pendingSuggestion={pendingSuggestion}
            isStreaming={isStreaming}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}