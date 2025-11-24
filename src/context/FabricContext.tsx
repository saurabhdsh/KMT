import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Fabric } from "../types/fabric";
import { getFabrics, createFabric, triggerFabricBuild, deleteFabric, CreateFabricPayload } from "../api/fabricsApi";

interface FabricContextType {
  fabrics: Fabric[];
  selectedFabricId: string | null;
  selectedFabric: Fabric | undefined;
  loading: boolean;
  error: string | null;
  reloadFabrics: (silent?: boolean) => Promise<void>;
  selectFabric: (id: string | null) => void;
  createNewFabric: (payload: CreateFabricPayload) => Promise<Fabric>;
  triggerBuild: (id: string) => Promise<void>;
  deleteFabric: (id: string) => Promise<void>;
}

const FabricContext = createContext<FabricContextType | undefined>(undefined);

export const useFabricContext = () => {
  const context = useContext(FabricContext);
  if (!context) {
    throw new Error("useFabricContext must be used within FabricProvider");
  }
  return context;
};

interface FabricProviderProps {
  children: ReactNode;
}

export const FabricProvider: React.FC<FabricProviderProps> = ({ children }) => {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reloadFabrics = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getFabrics();
      setFabrics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load fabrics");
      setFabrics([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const selectFabric = (id: string | null) => {
    setSelectedFabricId(id);
  };

  const createNewFabric = async (payload: CreateFabricPayload): Promise<Fabric> => {
    try {
      const newFabric = await createFabric(payload);
      await reloadFabrics();
      return newFabric;
    } catch (err: any) {
      throw new Error(err.message || "Failed to create fabric");
    }
  };

  const triggerBuild = async (id: string) => {
    try {
      await triggerFabricBuild(id);
      await reloadFabrics();
    } catch (err: any) {
      throw new Error(err.message || "Failed to trigger build");
    }
  };

  const handleDeleteFabric = async (id: string) => {
    try {
      await deleteFabric(id);
      // Clear selection if deleted fabric was selected
      if (selectedFabricId === id) {
        setSelectedFabricId(null);
      }
      await reloadFabrics();
    } catch (err: any) {
      throw new Error(err.message || "Failed to delete fabric");
    }
  };

  useEffect(() => {
    reloadFabrics();
  }, []);

  // Poll for status updates on fabrics that are building
  useEffect(() => {
    const buildingFabrics = fabrics.filter(
      (f) => f.status !== "Ready" && f.status !== "Error" && f.status !== "Draft"
    );

    if (buildingFabrics.length === 0) {
      return; // No fabrics building, no need to poll
    }

    // Poll every 3 seconds for status updates
    const pollInterval = setInterval(() => {
      reloadFabrics(true); // Silent reload to avoid loading spinner
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [fabrics]);

  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);

  return (
    <FabricContext.Provider
      value={{
        fabrics,
        selectedFabricId,
        selectedFabric,
        loading,
        error,
        reloadFabrics,
        selectFabric,
        createNewFabric,
        triggerBuild,
        deleteFabric: handleDeleteFabric,
      }}
    >
      {children}
    </FabricContext.Provider>
  );
};

