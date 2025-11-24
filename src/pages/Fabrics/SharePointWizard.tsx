import React, { useState } from "react";
import { useFabricContext } from "../../context/FabricContext";
import { useToast } from "../../components/toast/ToastProvider";
import { Stepper } from "../../components/common/Stepper";
import { CreateFabricPayload, testSharePointConnection } from "../../api/fabricsApi";
import { XMarkIcon, ShareIcon } from "@heroicons/react/24/outline";

interface SharePointWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  "Fabric Basics",
  "SharePoint Connection",
  "RAG Configuration",
  "Review & Create",
];

export const SharePointWizard: React.FC<SharePointWizardProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNewFabric, triggerBuild, reloadFabrics } = useFabricContext();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Incident Management");

  // Step 2: SharePoint
  const [siteUrl, setSiteUrl] = useState("");
  const [library, setLibrary] = useState("Documents");
  const [connectionTested, setConnectionTested] = useState(false);

  // Step 3: RAG Configuration
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-large");
  const [chromaCollection, setChromaCollection] = useState("");

  const handleTestConnection = async () => {
    if (!siteUrl) {
      showToast("Please enter SharePoint site URL", "error");
      return;
    }
    setTestingConnection(true);
    try {
      const result = await testSharePointConnection({
        siteUrl,
        library,
      });
      if (result.success) {
        showToast("SharePoint connection successful", "success");
        setConnectionTested(true);
      } else {
        showToast(result.message || "Connection failed", "error");
        setConnectionTested(false);
      }
    } catch (error: any) {
      showToast(error.message || "Connection test failed", "error");
      setConnectionTested(false);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !chromaCollection || !siteUrl) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateFabricPayload = {
        name,
        description,
        domain,
        sources: {
          sharePoint: {
            enabled: true,
            siteUrl,
            library,
          },
        },
        chunkSize,
        chunkOverlap,
        embeddingModel,
        chromaCollection,
      };

      const newFabric = await createNewFabric(payload);
      showToast("Fabric created. Building RAG architecture from SharePoint...", "info");

      // Trigger RAG architecture build
      // Backend will:
      // 1. Connect to SharePoint and fetch documents from library
      // 2. Parse documents (PDF, DOCX, etc.) from SharePoint
      // 3. Chunk documents (size: chunkSize, overlap: chunkOverlap)
      // 4. Generate embeddings (model: embeddingModel)
      // 5. Store vectors in Chroma DB (collection: chromaCollection)
      // 6. Build Knowledge Graph (extract entities/relationships)
      // 7. Mark fabric as "Ready" for RAG-powered chat
      await triggerBuild(newFabric.id);
      
      // Reload fabrics to show the new one in the list
      await reloadFabrics();
      
      showToast(
        "Knowledge Fabric created! RAG architecture build started. Status will update automatically.",
        "success"
      );
      handleClose();
    } catch (error: any) {
      showToast(error.message || "Failed to create fabric", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setName("");
    setDescription("");
    setDomain("Incident Management");
    setSiteUrl("");
    setLibrary("Documents");
    setConnectionTested(false);
    setChunkSize(512);
    setChunkOverlap(64);
    setEmbeddingModel("text-embedding-3-large");
    setChromaCollection("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="fixed right-0 top-0 h-full w-full lg:w-2/5 bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <ShareIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-slate-100">SharePoint Fabric</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <Stepper currentStep={currentStep} totalSteps={4} steps={STEPS} />

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fabric Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="e.g., SharePoint Knowledge Base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="Describe the purpose and scope of this knowledge fabric..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Business Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option>Incident Management</option>
                  <option>Problem Management</option>
                  <option>Change Management</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={handleClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!name}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">SharePoint Connection</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Site URL *
                    </label>
                    <input
                      type="text"
                      value={siteUrl}
                      onChange={(e) => {
                        setSiteUrl(e.target.value);
                        setConnectionTested(false);
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      placeholder="https://yourtenant.sharepoint.com/sites/yoursite"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Document Library *
                    </label>
                    <input
                      type="text"
                      value={library}
                      onChange={(e) => setLibrary(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      placeholder="Documents"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Name of the SharePoint document library to ingest from
                    </p>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || !siteUrl}
                    className="btn-secondary w-full"
                  >
                    {testingConnection ? "Testing..." : "Test Connection"}
                  </button>
                  {connectionTested && (
                    <div className="p-3 bg-green-600/20 border border-green-600/50 rounded-lg text-sm text-green-300">
                      ✓ Connection verified successfully
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => setCurrentStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!siteUrl || !library}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">Chunking Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chunk Size (tokens)
                    </label>
                    <input
                      type="number"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(parseInt(e.target.value) || 512)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chunk Overlap (tokens)
                    </label>
                    <input
                      type="number"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 64)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">Embedding Model</h3>
                <select
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option>text-embedding-3-large</option>
                  <option>text-embedding-3-small</option>
                  <option>azure-openai-embedding-1</option>
                  <option>custom-embedding</option>
                </select>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">Chroma Collection Name *</h3>
                <input
                  type="text"
                  value={chromaCollection}
                  onChange={(e) => setChromaCollection(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="sharepoint-knowledge-collection"
                />
              </div>

              <div className="card p-4 bg-green-600/10 border border-green-600/20">
                <h3 className="font-semibold text-slate-100 mb-3">RAG Architecture Pipeline</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>1. Ingest from SharePoint ({library})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>2. Text Chunking (Size: {chunkSize}, Overlap: {chunkOverlap})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>3. Vectorization ({embeddingModel})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>4. Store in Chroma DB ({chromaCollection})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>5. Build Knowledge Graph</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>6. Ready for RAG-powered Chat</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => setCurrentStep(2)} className="btn-secondary">
                  Back
                </button>
                <button onClick={() => setCurrentStep(4)} className="btn-primary">
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-semibold text-slate-100 mb-4">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400">Name:</span>{" "}
                    <span className="text-slate-100">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Description:</span>{" "}
                    <span className="text-slate-100">{description || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Domain:</span>{" "}
                    <span className="text-slate-100">{domain}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">SharePoint Site:</span>{" "}
                    <span className="text-slate-100">{siteUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Library:</span>{" "}
                    <span className="text-slate-100">{library}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Chunk Size:</span>{" "}
                    <span className="text-slate-100">{chunkSize}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Chunk Overlap:</span>{" "}
                    <span className="text-slate-100">{chunkOverlap}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Embedding Model:</span>{" "}
                    <span className="text-slate-100">{embeddingModel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Chroma Collection:</span>{" "}
                    <span className="text-slate-100">{chromaCollection}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => setCurrentStep(3)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !name || !chromaCollection || !siteUrl}
                  className="btn-primary"
                >
                  {loading ? "Creating RAG Architecture..." : "Create Fabric with RAG"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

