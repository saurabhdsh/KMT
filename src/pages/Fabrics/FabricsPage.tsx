import React, { useState } from "react";
import { FabricList } from "./FabricList";
import { DocumentUploadWizard } from "./DocumentUploadWizard";
import { ServiceNowWizard } from "./ServiceNowWizard";
import { SharePointWizard } from "./SharePointWizard";
import { FabricDetailDrawer } from "./FabricDetailDrawer";
import { Fabric } from "../../types/fabric";
import {
  DocumentArrowUpIcon,
  CloudIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

type WizardType = "document" | "servicenow" | "sharepoint" | null;

export const FabricsPage: React.FC = () => {
  const [activeWizard, setActiveWizard] = useState<WizardType>(null);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const handleViewDetails = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setIsDetailDrawerOpen(true);
  };

  const creationOptions = [
    {
      id: "document" as const,
      title: "Create Knowledge Fabric Using Document Uploads",
      description: "Upload DOCX and PDF files to build a knowledge fabric with RAG architecture",
      icon: DocumentArrowUpIcon,
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    {
      id: "servicenow" as const,
      title: "Create Knowledge Fabric from ServiceNow",
      description: "Connect to ServiceNow instance and ingest knowledge articles, incidents, and KBs",
      icon: CloudIcon,
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
    },
    {
      id: "sharepoint" as const,
      title: "Create Knowledge Fabric from SharePoint",
      description: "Connect to SharePoint site and ingest documents from libraries",
      icon: ShareIcon,
      color: "bg-green-600",
      hoverColor: "hover:bg-green-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Knowledge Fabric Builder
        </h1>
        <p className="text-slate-400">
          Create and orchestrate ServiceOps knowledge fabrics with complete RAG architecture.
        </p>
      </div>

      {/* Creation Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {creationOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setActiveWizard(option.id)}
              className={`card p-6 text-left transition-all duration-200 ${option.hoverColor} hover:shadow-xl hover:scale-105`}
            >
              <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                {option.title}
              </h3>
              <p className="text-sm text-slate-400">{option.description}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Link to Available Fabrics */}
      <div className="mt-8">
        <div className="card p-6 bg-gradient-to-r from-brand-600/10 to-brand-500/10 border border-brand-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                View All Available Fabrics
              </h3>
              <p className="text-sm text-slate-400">
                See all your created knowledge fabrics, their status, and manage them.
              </p>
            </div>
            <a
              href="/available-fabrics"
              className="btn-primary whitespace-nowrap"
            >
              View All Fabrics
            </a>
          </div>
        </div>
      </div>

      {/* Wizards */}
      <DocumentUploadWizard
        isOpen={activeWizard === "document"}
        onClose={() => setActiveWizard(null)}
      />
      <ServiceNowWizard
        isOpen={activeWizard === "servicenow"}
        onClose={() => setActiveWizard(null)}
      />
      <SharePointWizard
        isOpen={activeWizard === "sharepoint"}
        onClose={() => setActiveWizard(null)}
      />

      {/* Detail Drawer */}
      <FabricDetailDrawer
        fabric={selectedFabric}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedFabric(null);
        }}
      />
    </div>
  );
};
