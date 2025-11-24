export type FabricStatus =
  | "Draft"
  | "Ingesting"
  | "Chunking"
  | "Vectorizing"
  | "GraphBuilding"
  | "Ready"
  | "Error";

export interface FabricSources {
  serviceNow?: {
    enabled: boolean;
    instanceUrl?: string;
    tables?: string[];
  };
  sharePoint?: {
    enabled: boolean;
    siteUrl?: string;
    library?: string;
  };
  uploads?: {
    fileNames: string[];
  };
}

export interface Fabric {
  id: string;
  name: string;
  description: string;
  domain:
    | "Incident Management"
    | "Problem Management"
    | "Change Management"
    | string;
  status: FabricStatus;
  sources: FabricSources;
  createdAt: string;
  updatedAt: string;
  chunksCount?: number;
  graphNodes?: number;
  graphEdges?: number;
  documentsCount?: number;
  error?: string;
}

