import React, { useState, useRef, useEffect } from "react";
import { useFabricContext } from "../../context/FabricContext";
import { useChatContext } from "../../context/ChatContext";
import { useToast } from "../../components/toast/ToastProvider";
import { MessageBubble } from "./MessageBubble";
import { SourcePanel } from "./SourcePanel";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ArticleSource } from "../../types/chat";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const LLM_OPTIONS = [
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "azure-openai-internal", label: "Azure OpenAI Internal" },
  { id: "custom-llm-serviceops", label: "Custom LLM ServiceOps" },
];

export const ChatPage: React.FC = () => {
  const { fabrics, selectedFabricId, selectFabric } = useFabricContext();
  const {
    messages,
    selectedLLMId,
    isSending,
    temperature,
    maxTokens,
    setLLMId,
    setTemperature,
    setMaxTokens,
    sendMessage,
  } = useChatContext();
  const { showToast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [selectedSource, setSelectedSource] = useState<ArticleSource | null>(null);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const readyFabrics = fabrics.filter((f) => f.status === "Ready");
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedFabricId || !selectedLLMId) {
      showToast("Please select a fabric and LLM, and enter a message", "warning");
      return;
    }

    try {
      await sendMessage(inputValue);
      setInputValue("");
    } catch (error: any) {
      showToast(error.message || "Failed to send message", "error");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusText = isSending ? "Thinking..." : "Idle";
  const statusColor = isSending ? "text-blue-400" : "text-slate-400";

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="card p-4 mb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Fabric
              </label>
              <select
                value={selectedFabricId || ""}
                onChange={(e) => selectFabric(e.target.value || null)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select a fabric...</option>
                {readyFabrics.map((fabric) => (
                  <option key={fabric.id} value={fabric.id}>
                    {fabric.name}
                  </option>
                ))}
              </select>
              {readyFabrics.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No ready fabrics available. Create one in the Fabric Builder.
                </p>
              )}
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                LLM
              </label>
              <select
                value={selectedLLMId || ""}
                onChange={(e) => setLLMId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select an LLM...</option>
                {LLM_OPTIONS.map((llm) => (
                  <option key={llm.id} value={llm.id}>
                    {llm.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-300">
              {selectedFabric?.name || "No Fabric"} · {selectedLLMId || "No LLM"} ·{" "}
              <span className={statusColor}>{statusText}</span>
            </span>
            <button
              onClick={() => setShowSourcePanel(!showSourcePanel)}
              className="lg:hidden btn-secondary text-sm"
            >
              Sources
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 card p-6 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={<ChatBubbleLeftRightIcon className="w-16 h-16" />}
              title="Start a Conversation"
              message="Select a fabric and LLM, then ask a question about Service Operations."
            />
          ) : (
            <div>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSourceClick={(source) => {
                    setSelectedSource(source);
                    setShowSourcePanel(true);
                  }}
                />
              ))}
              {isSending && (
                <div className="flex justify-start mb-6">
                  <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm p-4">
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-slate-400">Assistant is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="card p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your issue or ask a question about Service Operations..."
              rows={3}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !selectedFabricId || !selectedLLMId || isSending}
              className="btn-primary self-end disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Source Panel - Desktop */}
      <div className="hidden lg:block">
        <SourcePanel selectedSource={selectedSource} />
      </div>

      {/* Source Panel - Mobile */}
      {showSourcePanel && (
        <div className="lg:hidden">
          <SourcePanel
            selectedSource={selectedSource}
            onClose={() => setShowSourcePanel(false)}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
};

