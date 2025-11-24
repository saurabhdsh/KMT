import axiosClient from "./axiosClient";
import { ChatRequest, ChatResponse } from "../types/chat";

export const sendChat = async (
  payload: ChatRequest
): Promise<ChatResponse> => {
  // Backend: RAG-powered chat integration
  // 1. Generate embedding for user message using same model as fabric
  // 2. Query Chroma DB collection (fabric's chromaCollection) for similar chunks
  //    - Use cosine similarity to find top N relevant chunks
  //    - Retrieve chunks with metadata (source, doc_id, etc.)
  // 3. Optionally query Knowledge Graph for related entities/relationships
  // 4. Build RAG context from retrieved chunks and graph nodes
  // 5. Construct prompt: System context + Retrieved chunks + User question
  // 6. Call LLM (specified by llmId) with RAG-enhanced prompt
  // 7. Extract source articles from retrieved chunks metadata
  // 8. Return LLM response with source citations
  try {
    const res = await axiosClient.post<ChatResponse>("/api/chat", payload);
    return res.data;
  } catch (err: any) {
    // Extract error message from response
    const errorMessage = err.response?.data?.error || err.message || "Failed to send chat message";
    const chatError = new Error(errorMessage);
    (chatError as any).status = err.response?.status;
    throw chatError;
  }
};

