import React, { useState } from "react";
import { useFabricContext } from "../../context/FabricContext";
import { useToast } from "../../components/toast/ToastProvider";
import { Stepper } from "../../components/common/Stepper";
import { CreateFabricPayload } from "../../api/fabricsApi";
import { testServiceNowConnection, testSharePointConnection } from "../../api/fabricsApi";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FabricWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  "Fabric Basics",
  "Connect & Ingest Sources",
  "Chunking & Vectorization",
  "Review & Confirm",
];

export const FabricWizard: React.FC<FabricWizardProps> = ({ isOpen, onClose }) => {
  const { createNewFabric, triggerBuild } = useFabricContext();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Incident Management");

  // Step 2: Sources
  const [serviceNowEnabled, setServiceNowEnabled] = useState(false);
  const [serviceNowUrl, setServiceNowUrl] = useState("");
  const [serviceNowTables, setServiceNowTables] = useState("");
  const [sharePointEnabled, setSharePointEnabled] = useState(false);
  const [sharePointUrl, setSharePointUrl] = useState("");
  const [sharePointLibrary, setSharePointLibrary] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Step 3: Chunking
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-large");
  const [chromaCollection, setChromaCollection] = useState("");

  const handleTestServiceNow = async () => {
    if (!serviceNowUrl) {
      showToast("Please enter ServiceNow instance URL", "error");
      return;
    }
    setTestingConnection("servicenow");
    try {
      const result = await testServiceNowConnection({
        instanceUrl: serviceNowUrl,
        tables: serviceNowTables.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (result.success) {
        showToast("ServiceNow connection successful", "success");
      } else {
        showToast(result.message || "Connection failed", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Connection test failed", "error");
    } finally {
      setTestingConnection(null);
    }
  };

  const handleTestSharePoint = async () => {
    if (!sharePointUrl) {
      showToast("Please enter SharePoint site URL", "error");
      return;
    }
    setTestingConnection("sharepoint");
    try {
      const result = await testSharePointConnection({
        siteUrl: sharePointUrl,
        library: sharePointLibrary,
      });
      if (result.success) {
        showToast("SharePoint connection successful", "success");
      } else {
        showToast(result.message || "Connection failed", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Connection test failed", "error");
    } finally {
      setTestingConnection(null);
    }
  };

  const handleCreate = async () => {
    if (!name || !chromaCollection) {
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
          serviceNow: serviceNowEnabled
            ? {
                enabled: true,
                instanceUrl: serviceNowUrl,
                tables: serviceNowTables.split(",").map((t) => t.trim()).filter(Boolean),
              }
            : undefined,
          sharePoint: sharePointEnabled
            ? {
                enabled: true,
                siteUrl: sharePointUrl,
                library: sharePointLibrary,
              }
            : undefined,
          uploads: uploadFiles.length > 0
            ? {
                fileNames: uploadFiles.map((f) => f.name),
              }
            : undefined,
        },
        chunkSize,
        chunkOverlap,
        embeddingModel,
        chromaCollection,
      };

      const newFabric = await createNewFabric(payload);
      await triggerBuild(newFabric.id);
      showToast("Fabric created. Build started.", "success");
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
    setServiceNowEnabled(false);
    setServiceNowUrl("");
    setServiceNowTables("");
    setSharePointEnabled(false);
    setSharePointUrl("");
    setSharePointLibrary("");
    setUploadFiles([]);
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
          <h2 className="text-xl font-bold text-slate-100">Create New Fabric</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
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
                  placeholder="e.g., Incident Resolution Knowledge Base"
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
            <div className="space-y-6">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-100">ServiceNow</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceNowEnabled}
                      onChange={(e) => setServiceNowEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
                {serviceNowEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Instance URL
                      </label>
                      <input
                        type="text"
                        value={serviceNowUrl}
                        onChange={(e) => setServiceNowUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        placeholder="https://yourinstance.service-now.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tables (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={serviceNowTables}
                        onChange={(e) => setServiceNowTables(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        placeholder="incident, kb_knowledge"
                      />
                    </div>
                    <button
                      onClick={handleTestServiceNow}
                      disabled={testingConnection === "servicenow"}
                      className="btn-secondary text-sm"
                    >
                      {testingConnection === "servicenow" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                )}
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-100">SharePoint</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sharePointEnabled}
                      onChange={(e) => setSharePointEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
                {sharePointEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Site URL
                      </label>
                      <input
                        type="text"
                        value={sharePointUrl}
                        onChange={(e) => setSharePointUrl(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        placeholder="https://yourtenant.sharepoint.com/sites/yoursite"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Library/Folder
                      </label>
                      <input
                        type="text"
                        value={sharePointLibrary}
                        onChange={(e) => setSharePointLibrary(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        placeholder="Documents"
                      />
                    </div>
                    <button
                      onClick={handleTestSharePoint}
                      disabled={testingConnection === "sharepoint"}
                      className="btn-secondary text-sm"
                    >
                      {testingConnection === "sharepoint" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                )}
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">Other Uploads</h3>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {/* TODO: Real file upload pipeline - currently only storing filenames */}
                  Selected files: {uploadFiles.map((f) => f.name).join(", ") || "None"}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button onClick={() => setCurrentStep(1)} className="btn-secondary">
                  Back
                </button>
                <button onClick={() => setCurrentStep(3)} className="btn-primary">
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
                      Chunk Size
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
                      Chunk Overlap
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
                  placeholder="knowledge-fabric-collection"
                />
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-slate-100 mb-4">Build Pipeline</h3>
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                    <span>Ingest</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span>Chunk</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span>Vectorize</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span>Store in Chroma DB</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span>Build Knowledge Graph</span>
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
                    <span className="text-slate-400">Sources:</span>{" "}
                    <span className="text-slate-100">
                      {serviceNowEnabled && "ServiceNow "}
                      {sharePointEnabled && "SharePoint "}
                      {uploadFiles.length > 0 && `Uploads (${uploadFiles.length})`}
                      {!serviceNowEnabled && !sharePointEnabled && uploadFiles.length === 0 && "None"}
                    </span>
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
                  disabled={loading || !name || !chromaCollection}
                  className="btn-primary"
                >
                  {loading ? "Creating..." : "Create Fabric"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

