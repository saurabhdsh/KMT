import React from "react";
import { useNavigate } from "react-router-dom";
import { FabricList } from "./FabricList";
import { FabricDetailDrawer } from "./FabricDetailDrawer";
import { Fabric } from "../../types/fabric";
import { useFabricContext } from "../../context/FabricContext";

export const AvailableFabricsPage: React.FC = () => {
  const { fabrics } = useFabricContext();
  const navigate = useNavigate();
  const [selectedFabric, setSelectedFabric] = React.useState<Fabric | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false);

  const handleViewDetails = (fabric: Fabric) => {
    setSelectedFabric(fabric);
    setIsDetailDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedFabric(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Available Fabrics
          </h1>
          <p className="text-slate-400">
            View and manage all your knowledge fabrics. Select a fabric to view details or start chatting.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">
            {fabrics.length} {fabrics.length === 1 ? "fabric" : "fabrics"}
          </span>
        </div>
      </div>

      <FabricList
        onViewDetails={handleViewDetails}
        onCreateNew={() => {
          // Navigate to fabric builder page
          navigate("/fabrics");
        }}
      />

      <FabricDetailDrawer
        fabric={selectedFabric}
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

