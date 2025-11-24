import axiosClient from "./axiosClient";

export interface FeedbackPayload {
  messageId: string;
  fabricId: string;
  llmId: string;
  rating: "up" | "down";
  comments?: string;
  conversationId: string;
  timestamp: string;
}

export const submitFeedback = async (
  payload: FeedbackPayload
): Promise<void> => {
  // TODO: Backend: store feedback in database / analytics store.
  await axiosClient.post("/api/feedback", payload);
};

