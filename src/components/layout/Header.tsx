import React from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-slate-900 border-b border-slate-800 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4 min-w-0 flex-1 overflow-hidden">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-slate-300 hover:text-white flex-shrink-0"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        )}
        <h2 className="text-lg font-semibold text-slate-100 overflow-hidden">
          <span className="hidden lg:inline">ServiceOps Knowledge Fabric Studio</span>
          <span className="lg:hidden">ServiceOps KF Studio</span>
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
          DEV
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <span className="text-xs text-slate-300">U</span>
        </div>
      </div>
    </header>
  );
};

