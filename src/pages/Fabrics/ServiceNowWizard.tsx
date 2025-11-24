import React, { useState, useEffect } from "react";
import { useFabricContext } from "../../context/FabricContext";
import { useToast } from "../../components/toast/ToastProvider";
import { Stepper } from "../../components/common/Stepper";
import { CreateFabricPayload, testServiceNowConnection, checkServiceNowCredentials } from "../../api/fabricsApi";
import { XMarkIcon, CloudIcon } from "@heroicons/react/24/outline";

interface ServiceNowWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  "Fabric Basics",
  "ServiceNow Connection",
  "RAG Configuration",
  "Review & Create",
];

export const ServiceNowWizard: React.FC<ServiceNowWizardProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNewFabric, triggerBuild, reloadFabrics } = useFabricContext();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean | null>(null);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Incident Management");

  // Step 2: ServiceNow
  const [instanceUrl, setInstanceUrl] = useState("");
  const [tables, setTables] = useState("incident,kb_knowledge");
  const [connectionTested, setConnectionTested] = useState(false);

  // Step 3: RAG Configuration
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-large");
  const [chromaCollection, setChromaCollection] = useState("");

  // Check credentials when wizard opens
  useEffect(() => {
    if (isOpen) {
      checkServiceNowCredentials()
        .then((result) => {
          setCredentialsConfigured(result.configured);
          if (!result.configured) {
            showToast(result.message || "Please set ServiceNow credentials first", "warning");
          }
        })
        .catch(() => {
          setCredentialsConfigured(false);
        });
    }
  }, [isOpen, showToast]);

  const handleTestConnection = async () => {
    if (!instanceUrl) {
      showToast("Please enter ServiceNow instance URL", "error");
      return;
    }
    
    // Check credentials first
    const credCheck = await checkServiceNowCredentials();
    if (!credCheck.configured) {
      showToast(credCheck.message || "Please set ServiceNow credentials first", "error");
      setCredentialsConfigured(false);
      return;
    }
    
    setTestingConnection(true);
    try {
      const result = await testServiceNowConnection({
        instanceUrl,
        tables: tables.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (result.success) {
        showToast("ServiceNow connection successful", "success");
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
    if (!name || !chromaCollection || !instanceUrl) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    // Check credentials before creating
    const credCheck = await checkServiceNowCredentials();
    if (!credCheck.configured) {
      showToast(credCheck.message || "Please set ServiceNow credentials in .env file first", "error");
      setCredentialsConfigured(false);
      return;
    }

    setLoading(true);
    try {
      const payload: CreateFabricPayload = {
        name,
        description,
        domain,
        sources: {
          serviceNow: {
            enabled: true,
            instanceUrl,
            tables: tables.split(",").map((t) => t.trim()).filter(Boolean),
          },
        },
        chunkSize,
        chunkOverlap,
        embeddingModel,
        chromaCollection,
      };

      const newFabric = await createNewFabric(payload);
      showToast("Fabric created. Building RAG architecture from ServiceNow...", "info");

      // Trigger RAG architecture build
      // Backend will:
      // 1. Connect to ServiceNow and fetch data from tables
      // 2. Extract text from ServiceNow records (incidents, KB articles, etc.)
      // 3. Chunk documents (size: chunkSize, overlap: chunkOverlap)
      // 4. Generate embeddings (model: embeddingModel)
      // 5. Store vectors in Chroma DB (collection: chromaCollection)
      // 6. Build Knowledge Graph (extract entities/relationships from ServiceNow data)
      // 7. Mark fabric as "Ready" for RAG-powered chat
      try {
        await triggerBuild(newFabric.id);
        
        // Reload fabrics to show the new one in the list
        await reloadFabrics();
        
        showToast(
          "Knowledge Fabric created! RAG architecture build started. Status will update automatically.",
          "success"
        );
        handleClose();
      } catch (buildError: any) {
        // Build failed, but fabric was created
        await reloadFabrics();
        const errorMsg = buildError.message || buildError.response?.data?.error || "Failed to start build";
        showToast(
          `Fabric created but build failed: ${errorMsg}. You can try building it again from the fabric list.`,
          "error"
        );
        handleClose();
      }
    } catch (error: any) {
      const errorMsg = error.message || error.response?.data?.error || "Failed to create fabric";
      if (errorMsg.includes("Network Error") || errorMsg.includes("timeout")) {
        showToast(
          "Network error. Please check your connection and ensure the backend server is running.",
          "error"
        );
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setName("");
    setDescription("");
    setDomain("Incident Management");
    setInstanceUrl("");
    setTables("incident,kb_knowledge");
    setConnectionTested(false);
    setChunkSize(512);
    setChunkOverlap(64);
    setEmbeddingModel("text-embedding-3-large");
    setChromaCollection("");
    setCredentialsConfigured(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="fixed right-0 top-0 h-full w-full lg:w-2/5 bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <CloudIcon className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">ServiceNow Fabric</h2>
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
                  placeholder="e.g., ServiceNow Incident Knowledge Base"
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
              {credentialsConfigured === false && (
                <div className="card p-4 bg-yellow-600/20 border border-yellow-600/50">
                  <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Credentials Not Configured</h3>
                  <p className="text-sm text-yellow-200">
                    Please set SERVICENOW_USERNAME and SERVICENOW_PASSWORD in your .env file before creating a ServiceNow Fabric.
                  </p>
                  <p className="text-xs text-yellow-300/80 mt-2">
                    Copy .env.example to .env and fill in your ServiceNow credentials.
                  </p>
                </div>
              )}
              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">ServiceNow Connection</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Instance URL *
                    </label>
                    <input
                      type="text"
                      value={instanceUrl}
                      onChange={(e) => {
                        setInstanceUrl(e.target.value);
                        setConnectionTested(false);
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      placeholder="https://yourinstance.service-now.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tables to Ingest (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={tables}
                      onChange={(e) => setTables(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                      placeholder="incident,kb_knowledge,problem"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Common tables: incident, kb_knowledge, problem, change_request
                    </p>
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || !instanceUrl}
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
                  disabled={!instanceUrl || !tables}
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
                  placeholder="servicenow-knowledge-collection"
                />
              </div>

              <div className="card p-4 bg-purple-600/10 border border-purple-600/20">
                <h3 className="font-semibold text-slate-100 mb-3">RAG Architecture Pipeline</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>1. Ingest from ServiceNow ({tables})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>2. Text Chunking (Size: {chunkSize}, Overlap: {chunkOverlap})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>3. Vectorization ({embeddingModel})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>4. Store in Chroma DB ({chromaCollection})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>5. Build Knowledge Graph</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
              {credentialsConfigured === false && (
                <div className="card p-4 bg-red-600/20 border border-red-600/50">
                  <h3 className="font-semibold text-red-300 mb-2">❌ Cannot Create Fabric</h3>
                  <p className="text-sm text-red-200">
                    ServiceNow credentials are not configured. Please set SERVICENOW_USERNAME and SERVICENOW_PASSWORD in your .env file first.
                  </p>
                  <p className="text-xs text-red-300/80 mt-2">
                    Copy .env.example to .env and fill in your ServiceNow credentials.
                  </p>
                </div>
              )}
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
                    <span className="text-slate-400">ServiceNow Instance:</span>{" "}
                    <span className="text-slate-100">{instanceUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tables:</span>{" "}
                    <span className="text-slate-100">{tables}</span>
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
                  disabled={loading || !name || !chromaCollection || !instanceUrl || credentialsConfigured === false}
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

