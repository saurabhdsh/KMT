import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    path: "/fabrics",
    label: "Knowledge Fabric Builder",
    icon: CubeIcon,
  },
  {
    path: "/available-fabrics",
    label: "Available Fabrics",
    icon: CubeIcon,
  },
  {
    path: "/chat",
    label: "Chat on Fabric",
    icon: ChatBubbleLeftRightIcon,
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-slate-100">ServiceOps</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Knowledge Fabric<br />Studio
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

