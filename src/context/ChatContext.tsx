import React, { createContext, useContext, useState, ReactNode } from "react";
import { ChatMessage, ChatRequest } from "../types/chat";
import { sendChat } from "../api/chatApi";
import { useFabricContext } from "./FabricContext";

interface ChatContextType {
  conversationId: string | null;
  messages: ChatMessage[];
  selectedLLMId: string | null;
  isSending: boolean;
  temperature: number;
  maxTokens: number;
  setLLMId: (llmId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  resetChat: () => void;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { selectedFabricId } = useFabricContext();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedLLMId, setSelectedLLMId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2000);

  const setLLMId = (llmId: string) => {
    setSelectedLLMId(llmId);
  };

  const resetChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const sendMessage = async (content: string) => {
    if (!selectedFabricId || !selectedLLMId) {
      throw new Error("Fabric and LLM must be selected");
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const request: ChatRequest = {
        fabricId: selectedFabricId,
        llmId: selectedLLMId,
        messages: updatedMessages,
        temperature,
        maxTokens,
      };

      const response = await sendChat(request);
      setMessages(response.messages);
      setConversationId(response.conversationId);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${error.message || "Failed to send message"}`,
        createdAt: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errorMessage]);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversationId,
        messages,
        selectedLLMId,
        isSending,
        temperature,
        maxTokens,
        setLLMId,
        setTemperature,
        setMaxTokens,
        resetChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

