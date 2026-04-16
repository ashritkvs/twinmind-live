"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, RefreshCw } from "lucide-react";

interface Props {
  transcript: string[];
  isRecording: boolean;
  onStartStop: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function TranscriptPanel({
  transcript,
  isRecording,
  onStartStop,
  onRefresh,
  isRefreshing,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-gray-300">Mic & Transcript</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isRecording
              ? "bg-red-500/20 text-red-400"
              : "bg-gray-700 text-gray-500"
          }`}>
            {isRecording ? "RECORDING" : "IDLE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing || !isRecording}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition"
            title="Refresh suggestions"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onStartStop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isRecording ? (
              <>
                <MicOff size={13} /> Stop
              </>
            ) : (
              <>
                <Mic size={13} /> Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transcript Lines */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {transcript.length === 0 ? (
          <p className="text-gray-600 text-sm italic">
            Click mic to start. Transcript appends every ~30s.
          </p>
        ) : (
          transcript.map((line, i) => (
            <p key={i} className="text-sm text-gray-300 leading-relaxed">
              {line}
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}