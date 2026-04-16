"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Settings, loadSettings, saveSettings, DEFAULT_SETTINGS } from "@/lib/settings";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleChange(key: keyof Settings, value: string | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(settings);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">Settings</h2>

        {/* API Key */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Groq API Key *</label>
          <input
            type="password"
            value={settings.groqApiKey}
            onChange={(e) => handleChange("groqApiKey", e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Suggestion Prompt */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Live Suggestion Prompt</label>
          <textarea
            value={settings.suggestionPrompt}
            onChange={(e) => handleChange("suggestionPrompt", e.target.value)}
            rows={8}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Detailed Answer Prompt */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Detailed Answer Prompt (on card click)</label>
          <textarea
            value={settings.detailedAnswerPrompt}
            onChange={(e) => handleChange("detailedAnswerPrompt", e.target.value)}
            rows={6}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Chat Prompt */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Chat Prompt</label>
          <textarea
            value={settings.chatPrompt}
            onChange={(e) => handleChange("chatPrompt", e.target.value)}
            rows={5}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Context Windows */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              Suggestion Context (lines)
            </label>
            <input
              type="number"
              value={settings.suggestionContextLines}
              onChange={(e) => handleChange("suggestionContextLines", parseInt(e.target.value))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              Chat Context (lines)
            </label>
            <input
              type="number"
              value={settings.chatContextLines}
              onChange={(e) => handleChange("chatContextLines", parseInt(e.target.value))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
