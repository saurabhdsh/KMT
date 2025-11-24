import axiosClient from "./axiosClient";
import { Fabric } from "../types/fabric";

export const getFabrics = async (): Promise<Fabric[]> => {
  const res = await axiosClient.get<Fabric[]>("/api/fabrics");
  return res.data;
};

export const getFabricById = async (id: string): Promise<Fabric> => {
  const res = await axiosClient.get<Fabric>(`/api/fabrics/${id}`);
  return res.data;
};

export interface CreateFabricPayload {
  name: string;
  description: string;
  domain: string;
  sources: Fabric["sources"];
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  chromaCollection: string;
}

export const createFabric = async (
  payload: CreateFabricPayload
): Promise<Fabric> => {
  // TODO: Backend: create fabric, persist config, initiate build state = "Draft" or "Ingesting"
  const res = await axiosClient.post<Fabric>("/api/fabrics", payload);
  return res.data;
};

export const triggerFabricBuild = async (
  id: string
): Promise<{ status: string; message?: string }> => {
  // Backend: start RAG pipeline
  // 1. Ingest documents from source (ServiceNow/SharePoint/uploads)
  // 2. Chunk documents (configurable size/overlap)
  // 3. Generate embeddings using specified model
  // 4. Store vectorized chunks in Chroma DB collection
  // 5. Build Knowledge Graph (extract entities/relationships)
  // 6. Mark fabric as "Ready" for RAG-powered chat
  try {
    const res = await axiosClient.post<{ status: string; message?: string }>(
      `/api/fabrics/${id}/build`
    );
    return res.data;
  } catch (err: any) {
    const errorMessage = err.response?.data?.error || err.message || "Failed to trigger build";
    const buildError = new Error(errorMessage);
    (buildError as any).status = err.response?.status;
    throw buildError;
  }
};

export const uploadDocuments = async (
  fabricId: string,
  files: File[]
): Promise<{ success: boolean; message?: string }> => {
  // Backend: upload files and trigger RAG architecture creation
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  formData.append("fabricId", fabricId);

  const res = await axiosClient.post<{ success: boolean; message?: string }>(
    `/api/fabrics/${fabricId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const checkServiceNowCredentials = async (): Promise<{
  configured: boolean;
  message?: string;
}> => {
  const res = await axiosClient.get<{ configured: boolean; message?: string }>(
    "/api/connections/servicenow/check-credentials"
  );
  return res.data;
};

export const testServiceNowConnection = async (config: {
  instanceUrl: string;
  tables?: string[];
}): Promise<{ success: boolean; message?: string }> => {
  const res = await axiosClient.post<{ success: boolean; message?: string }>(
    "/api/connections/servicenow/test",
    config
  );
  return res.data;
};

export const testSharePointConnection = async (config: {
  siteUrl: string;
  library?: string;
}): Promise<{ success: boolean; message?: string }> => {
  const res = await axiosClient.post<{ success: boolean; message?: string }>(
    "/api/connections/sharepoint/test",
    config
  );
  return res.data;
};

export const deleteFabric = async (
  id: string
): Promise<{ success: boolean; message?: string }> => {
  const res = await axiosClient.delete<{ success: boolean; message?: string }>(
    `/api/fabrics/${id}`
  );
  return res.data;
};

