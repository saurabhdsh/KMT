import React from "react";
import { ArticleSource } from "../../types/chat";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SourcePanelProps {
  selectedSource: ArticleSource | null;
  onClose?: () => void;
  isMobile?: boolean;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  selectedSource,
  onClose,
  isMobile = false,
}) => {
  if (isMobile && !selectedSource) return null;

  return (
    <div
      className={`${
        isMobile
          ? "fixed inset-0 z-50 bg-slate-900"
          : "w-80 border-l border-slate-800 bg-slate-900"
      } flex flex-col`}
    >
      {isMobile && onClose && (
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">Source Articles</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedSource ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                {selectedSource.title}
              </h3>
              <div className="text-xs text-slate-400 mb-4">ID: {selectedSource.id}</div>
              {selectedSource.id && (selectedSource.id.startsWith("INC") || selectedSource.id.startsWith("KB")) && (
                <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded p-2 mb-4">
                  ⚠️ Note: If this record doesn't exist in ServiceNow, it may have been deleted. The fabric data was captured at the time of creation and may be stale. Try rebuilding the fabric to get the latest data.
                </div>
              )}
            </div>
            <div className="text-sm text-slate-300 mb-4">{selectedSource.snippet}</div>
            {selectedSource.link && (
              <div className="space-y-2">
                <a
                  href={selectedSource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm inline-flex items-center"
                >
                  Open Source
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                {selectedSource.id && (selectedSource.id.startsWith("INC") || selectedSource.id.startsWith("KB")) && (
                  <p className="text-xs text-slate-500 mt-2">
                    If the link doesn't work, try searching for "{selectedSource.id}" directly in ServiceNow.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-400 mt-8">
            <p>Select a source from a response to see details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

