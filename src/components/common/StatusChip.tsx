import React from "react";
import { FabricStatus } from "../../types/fabric";

interface StatusChipProps {
  status: FabricStatus;
}

const statusColors: Record<FabricStatus, string> = {
  Draft: "bg-slate-600 text-slate-100",
  Ingesting: "bg-blue-600 text-white",
  Chunking: "bg-purple-600 text-white",
  Vectorizing: "bg-indigo-600 text-white",
  GraphBuilding: "bg-violet-600 text-white",
  Ready: "bg-green-600 text-white",
  Error: "bg-red-600 text-white",
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      {status}
    </span>
  );
};

