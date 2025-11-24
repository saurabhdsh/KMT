import React from "react";
import { useNavigate } from "react-router-dom";
import { useFabricContext } from "../../context/FabricContext";
import { useToast } from "../../components/toast/ToastProvider";
import { StatusChip } from "../../components/common/StatusChip";
import { Fabric } from "../../types/fabric";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FabricDetailDrawerProps {
  fabric: Fabric | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FabricDetailDrawer: React.FC<FabricDetailDrawerProps> = ({
  fabric,
  isOpen,
  onClose,
}) => {
  const { triggerBuild, selectFabric, reloadFabrics } = useFabricContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentFabric, setCurrentFabric] = React.useState(fabric);

  // Update fabric when it changes (from polling)
  React.useEffect(() => {
    if (fabric) {
      setCurrentFabric(fabric);
    }
  }, [fabric]);

  // Poll for status updates if fabric is building
  React.useEffect(() => {
    if (!isOpen || !currentFabric) return;
    
    const isBuilding = currentFabric.status !== "Ready" && 
                      currentFabric.status !== "Error" && 
                      currentFabric.status !== "Draft";
    
    if (!isBuilding) return;

    const pollInterval = setInterval(() => {
      reloadFabrics(true).then(() => {
        // Fabric will be updated via useEffect above
      });
    }, 2000); // Poll every 2 seconds when drawer is open

    return () => clearInterval(pollInterval);
  }, [isOpen, currentFabric?.status, reloadFabrics]);

  if (!isOpen || !currentFabric) return null;

  const handleRebuild = async () => {
    try {
      await triggerBuild(currentFabric.id);
      await reloadFabrics();
      showToast("Fabric build triggered. Status will update automatically.", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to trigger build", "error");
    }
  };

  const handleGoToChat = () => {
    selectFabric(currentFabric.id);
    navigate("/chat");
    onClose();
  };

  const getStatusStep = (status: string) => {
    const steps = ["Draft", "Ingesting", "Chunking", "Vectorizing", "GraphBuilding", "Ready"];
    const stepIndex = steps.indexOf(status);
    // If status is Ready, return the last index (5), but mark as completed
    // If status is Error, return -1 to show error state
    return stepIndex >= 0 ? stepIndex : -1;
  };

  const currentStep = getStatusStep(currentFabric.status);
  const isReady = currentFabric.status === "Ready";
  const isError = currentFabric.status === "Error";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full lg:w-2/5 bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-100">{currentFabric.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="card p-4">
            <h3 className="font-semibold text-slate-100 mb-4">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <StatusChip status={currentFabric.status} />
                {currentFabric.status !== "Ready" && currentFabric.status !== "Error" && currentFabric.status !== "Draft" && (
                  <span className="ml-2 text-xs text-blue-400 animate-pulse">Building...</span>
                )}
              </div>
              <div>
                <span className="text-slate-400">Description:</span>{" "}
                <span className="text-slate-100">{currentFabric.description || "None"}</span>
              </div>
              <div>
                <span className="text-slate-400">Domain:</span>{" "}
                <span className="text-slate-100">{currentFabric.domain}</span>
              </div>
              <div>
                <span className="text-slate-400">Created:</span>{" "}
                <span className="text-slate-100">
                  {new Date(currentFabric.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Updated:</span>{" "}
                <span className="text-slate-100">
                  {new Date(currentFabric.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-slate-100 mb-4">Source Configuration</h3>
            <div className="space-y-3 text-sm">
              {currentFabric.sources.serviceNow?.enabled && (
                <div>
                  <span className="text-slate-400">ServiceNow:</span>
                  <div className="ml-4 mt-1 text-slate-300">
                    <div>Instance: {currentFabric.sources.serviceNow.instanceUrl || "N/A"}</div>
                    <div>Tables: {currentFabric.sources.serviceNow.tables?.join(", ") || "N/A"}</div>
                  </div>
                </div>
              )}
              {currentFabric.sources.sharePoint?.enabled && (
                <div>
                  <span className="text-slate-400">SharePoint:</span>
                  <div className="ml-4 mt-1 text-slate-300">
                    <div>Site: {currentFabric.sources.sharePoint.siteUrl || "N/A"}</div>
                    <div>Library: {currentFabric.sources.sharePoint.library || "N/A"}</div>
                  </div>
                </div>
              )}
              {currentFabric.sources.uploads?.fileNames && currentFabric.sources.uploads.fileNames.length > 0 && (
                <div>
                  <span className="text-slate-400">Uploads:</span>
                  <div className="ml-4 mt-1 text-slate-300">
                    {currentFabric.sources.uploads.fileNames.map((name, idx) => (
                      <div key={idx}>{name}</div>
                    ))}
                  </div>
                </div>
              )}
              {!currentFabric.sources.serviceNow?.enabled &&
                !currentFabric.sources.sharePoint?.enabled &&
                !currentFabric.sources.uploads?.fileNames && (
                  <div className="text-slate-400">No sources configured</div>
                )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-slate-100 mb-4">Build Progress</h3>
            <div className="space-y-3">
              {["Draft", "Ingesting", "Chunking", "Vectorizing", "GraphBuilding", "Ready"].map(
                (step, idx) => {
                  // If status is Ready, all steps including Ready are completed
                  // If status is Error, show error state
                  const isActive = !isReady && !isError && idx === currentStep;
                  const isCompleted = isReady ? idx <= currentStep : idx < currentStep;
                  const isPending = !isReady && !isError && idx > currentStep;
                  
                  return (
                    <div
                      key={step}
                      className={`relative flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? "bg-brand-600/20 border border-brand-500/50 shadow-lg shadow-brand-500/20" 
                          : isCompleted
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-slate-800/50 border border-slate-700/50"
                      }`}
                    >
                      {/* Progress bar indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-l-lg animate-pulse" />
                      )}
                      {isCompleted && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg" />
                      )}
                      
                      {/* Step number/icon */}
                      <div className="relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                              : isActive
                              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/50 animate-pulse scale-110"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                      </div>
                      
                      {/* Step label */}
                      <div className="flex-1">
                        <span
                          className={`text-sm font-medium transition-all duration-300 ${
                            isActive
                              ? "text-brand-300 font-semibold"
                              : isCompleted
                              ? "text-green-300"
                              : "text-slate-400"
                          }`}
                        >
                          {step}
                        </span>
                        {isActive && (
                          <div className="mt-1 flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-brand-400 font-medium">
                              Processing...
                            </span>
                          </div>
                        )}
                        {isCompleted && !isActive && (
                          <div className="mt-1 text-xs text-green-400">
                            {step === "Ready" ? "Ready" : "Completed"}
                          </div>
                        )}
                      </div>
                      
                      {/* Progress percentage for active step */}
                      {isActive && (
                        <div className="text-xs text-brand-400 font-semibold">
                          {Math.round(((idx + 1) / 6) * 100)}%
                        </div>
                      )}
                      {isReady && step === "Ready" && (
                        <div className="text-xs text-green-400 font-semibold">
                          100%
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            
            {/* Overall progress bar */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Overall Progress</span>
                <span className={`text-xs font-semibold ${isReady ? "text-green-400" : "text-brand-400"}`}>
                  {isReady ? "100%" : `${Math.round(((currentStep + 1) / 6) * 100)}%`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                    isReady 
                      ? "bg-gradient-to-r from-green-500 to-green-400" 
                      : "bg-gradient-to-r from-brand-500 to-brand-400"
                  }`}
                  style={{ width: `${isReady ? 100 : ((currentStep + 1) / 6) * 100}%` }}
                >
                  {!isReady && <div className="absolute inset-0 bg-brand-400/50 animate-pulse" />}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-slate-100 mb-4">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Documents:</span>{" "}
                <span className="text-slate-100">
                  {currentFabric.documentsCount !== undefined 
                    ? currentFabric.documentsCount.toLocaleString() 
                    : currentFabric.sources.serviceNow?.enabled 
                      ? "125" // ServiceNow default fetch count
                      : currentFabric.sources.uploads?.fileNames?.length || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Chunks:</span>{" "}
                <span className="text-slate-100">
                  {currentFabric.chunksCount !== undefined 
                    ? currentFabric.chunksCount.toLocaleString() 
                    : currentFabric.status === "Ready" 
                      ? "N/A" 
                      : "Processing..."}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Graph Nodes:</span>{" "}
                <span className="text-slate-100">
                  {currentFabric.graphNodes !== undefined 
                    ? currentFabric.graphNodes.toLocaleString() 
                    : currentFabric.status === "Ready" 
                      ? "0" 
                      : "Processing..."}
                </span>
              </div>
              {currentFabric.graphEdges !== undefined && currentFabric.graphEdges > 0 && (
                <div>
                  <span className="text-slate-400">Graph Edges:</span>{" "}
                  <span className="text-slate-100">
                    {currentFabric.graphEdges.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button onClick={handleRebuild} className="btn-secondary flex-1">
              Rebuild Fabric
            </button>
            <button
              onClick={handleGoToChat}
              disabled={currentFabric.status !== "Ready"}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Go to Chat with this Fabric
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

