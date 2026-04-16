"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Suggestion } from "./SuggestionsPanel";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Props {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  pendingSuggestion: Suggestion | null;
  isStreaming: boolean;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  pendingSuggestion,
  isStreaming,
}: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (pendingSuggestion) {
      setInput(pendingSuggestion.preview);
    }
  }, [pendingSuggestion]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    onSendMessage(msg);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-sm text-gray-300">Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm italic">
            Click a suggestion or type a question...
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-xs opacity-40 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the conversation..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl px-3 transition"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
