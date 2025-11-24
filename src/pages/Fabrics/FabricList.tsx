import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFabricContext } from "../../context/FabricContext";
import { useToast } from "../../components/toast/ToastProvider";
import { StatusChip } from "../../components/common/StatusChip";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { Fabric } from "../../types/fabric";
import { CubeIcon, TrashIcon } from "@heroicons/react/24/outline";

interface FabricListProps {
  onViewDetails: (fabric: Fabric) => void;
  onCreateNew: () => void;
}

export const FabricList: React.FC<FabricListProps> = ({
  onViewDetails,
  onCreateNew,
}) => {
  const { fabrics, loading, selectFabric, deleteFabric } = useFabricContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleGoToChat = (fabric: Fabric) => {
    selectFabric(fabric.id);
    navigate("/chat");
  };

  const handleDeleteClick = (e: React.MouseEvent, fabricId: string) => {
    e.stopPropagation(); // Prevent triggering parent click events
    setConfirmDeleteId(fabricId);
  };

  const handleConfirmDelete = async (fabricId: string) => {
    setDeletingId(fabricId);
    try {
      await deleteFabric(fabricId);
      showToast("Fabric deleted successfully", "success");
      setConfirmDeleteId(null);
    } catch (error: any) {
      showToast(error.message || "Failed to delete fabric", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fabrics.length === 0) {
    return (
      <EmptyState
        icon={<CubeIcon className="w-16 h-16" />}
        title="No Knowledge Fabrics Yet"
        message="Create your first knowledge fabric to start orchestrating ServiceOps knowledge from ServiceNow, SharePoint, and other sources."
        actionLabel="Create New Fabric"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fabrics.map((fabric) => {
        const isBuilding = fabric.status !== "Ready" && fabric.status !== "Error" && fabric.status !== "Draft";
        return (
        <div 
          key={fabric.id} 
          className={`card p-6 hover:shadow-xl transition-all duration-200 relative ${
            isBuilding ? "ring-2 ring-brand-500/30 animate-pulse" : ""
          }`}
        >
          {/* Delete button */}
          <button
            onClick={(e) => handleDeleteClick(e, fabric.id)}
            disabled={deletingId === fabric.id}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Delete fabric"
          >
            <TrashIcon className="w-5 h-5" />
          </button>

          <div className="flex items-start justify-between mb-4 pr-8">
            <h3 className="text-lg font-semibold text-slate-100">{fabric.name}</h3>
            <div className="flex items-center space-x-2">
              <StatusChip status={fabric.status} />
              {isBuilding && (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">
            {fabric.description || "No description"}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {fabric.sources.serviceNow?.enabled && (
              <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded">
                ServiceNow
              </span>
            )}
            {fabric.sources.sharePoint?.enabled && (
              <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                SharePoint
              </span>
            )}
            {fabric.sources.uploads?.fileNames && fabric.sources.uploads.fileNames.length > 0 && (
              <span className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded">
                Uploads ({fabric.sources.uploads.fileNames.length})
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">
            Updated: {new Date(fabric.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(fabric)}
              className="btn-secondary flex-1 text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => handleGoToChat(fabric)}
              disabled={fabric.status !== "Ready"}
              className="btn-primary flex-1 text-sm disabled:opacity-50"
            >
              Go to Chat
            </button>
          </div>
        </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Delete Fabric?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete this fabric? This action cannot be undone. All associated data, including uploaded documents and RAG architecture, will be permanently deleted.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleConfirmDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deletingId === confirmDeleteId}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

