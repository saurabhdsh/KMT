export interface ArticleSource {
  id: string;
  title: string;
  snippet: string;
  link: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  sources?: ArticleSource[];
}

export interface ChatRequest {
  fabricId: string;
  llmId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  messages: ChatMessage[];
  conversationId: string;
}

