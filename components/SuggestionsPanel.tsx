"use client";

import { RefreshCw } from "lucide-react";

export interface Suggestion {
  type: string;
  preview: string;
  detail: string;
}

export interface SuggestionBatch {
  timestamp: string;
  suggestions: Suggestion[];
}

interface Props {
  batches: SuggestionBatch[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  isRecording: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  QUESTION: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  FACT_CHECK: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  TALKING_POINT: "bg-green-500/20 text-green-300 border-green-500/30",
  CLARIFICATION: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  ANSWER: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function SuggestionsPanel({
  batches,
  onSuggestionClick,
  isRefreshing,
  onRefresh,
  isRecording,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-sm text-gray-300">Live Suggestions</h2>
        <button
          onClick={onRefresh}
          disabled={isRefreshing || !isRecording}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Batches */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        {isRefreshing && batches.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-800/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {batches.length === 0 && !isRefreshing && (
          <p className="text-gray-600 text-sm italic">
            Suggestions will appear as you speak...
          </p>
        )}

        {batches.map((batch, batchIndex) => (
          <div key={batchIndex}>
            {/* Batch timestamp */}
            <p className="text-xs text-gray-600 mb-2">
              {new Date(batch.timestamp).toLocaleTimeString()}
            </p>

            {/* Cards */}
            <div className="space-y-2">
              {batch.suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick(suggestion)}
                  className={`w-full text-left rounded-xl border p-3 transition hover:brightness-125 ${
                    batchIndex === 0
                      ? "opacity-100"
                      : "opacity-50 hover:opacity-75"
                  } ${
                    TYPE_COLORS[suggestion.type] ||
                    "bg-gray-800 text-gray-300 border-gray-700"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wide opacity-70 block mb-1">
                    {suggestion.type.replace("_", " ")}
                  </span>
                  <span className="text-sm leading-snug">{suggestion.preview}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
