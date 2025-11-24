import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessage, ArticleSource } from "../../types/chat";
import { submitFeedback, FeedbackPayload } from "../../api/feedbackApi";
import { useToast } from "../../components/toast/ToastProvider";
import { useChatContext } from "../../context/ChatContext";
import { useFabricContext } from "../../context/FabricContext";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";

interface MessageBubbleProps {
  message: ChatMessage;
  onSourceClick?: (source: ArticleSource) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSourceClick }) => {
  const { conversationId, selectedLLMId } = useChatContext();
  const { selectedFabricId } = useFabricContext();
  const { showToast } = useToast();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comments, setComments] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleFeedbackClick = (selectedRating: "up" | "down") => {
    setRating(selectedRating);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    if (!rating || !conversationId || !selectedFabricId || !selectedLLMId) {
      return;
    }

    setSubmittingFeedback(true);
    try {
      const payload: FeedbackPayload = {
        messageId: message.id,
        fabricId: selectedFabricId,
        llmId: selectedLLMId,
        rating,
        comments: comments || undefined,
        conversationId,
        timestamp: new Date().toISOString(),
      };
      await submitFeedback(payload);
      showToast("Thanks for your feedback!", "success");
      setShowFeedbackForm(false);
      setRating(null);
      setComments("");
    } catch (error: any) {
      showToast(error.message || "Failed to submit feedback", "error");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-3xl ${
          isUser
            ? "bg-brand-600 text-white rounded-2xl rounded-tr-sm"
            : "bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm"
        } p-4`}
      >
        {isAssistant ? (
          <div className="space-y-3">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.sources && message.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-700">
                <div className="text-xs font-semibold text-slate-400 mb-2">Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source: ArticleSource) => (
                    <SourceChip key={source.id} source={source} onSourceClick={onSourceClick} />
                  ))}
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-slate-400">Was this helpful?</span>
                <button
                  onClick={() => handleFeedbackClick("up")}
                  className="text-slate-400 hover:text-green-400 transition-colors"
                >
                  <HandThumbUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFeedbackClick("down")}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <HandThumbDownIcon className="w-4 h-4" />
                </button>
              </div>
              {showFeedbackForm && (
                <div className="mt-3 p-3 bg-slate-900 rounded-lg space-y-2">
                  <div className="text-xs text-slate-300">
                    You selected: {rating === "up" ? "👍 Helpful" : "👎 Not helpful"}
                  </div>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Tell us what worked / didn't work (optional)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                      className="btn-primary text-xs px-3 py-1"
                    >
                      {submittingFeedback ? "Submitting..." : "Submit feedback"}
                    </button>
                    <button
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setRating(null);
                        setComments("");
                      }}
                      className="btn-secondary text-xs px-3 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>{message.content}</div>
        )}
      </div>
    </div>
  );
};

interface SourceChipProps {
  source: ArticleSource;
  onSourceClick?: (source: ArticleSource) => void;
}

const SourceChip: React.FC<SourceChipProps> = ({ source, onSourceClick }) => {
  return (
    <button
      onClick={() => onSourceClick?.(source)}
      className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
      title={source.title}
    >
      {source.id} | {source.title}
    </button>
  );
};

