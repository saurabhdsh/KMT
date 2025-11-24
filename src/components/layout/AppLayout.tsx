import React, { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />
      <div className="flex pt-16">
        <Sidebar />
        <div
          className={`fixed inset-0 bg-black/50 z-30 lg:hidden ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 lg:ml-72 min-h-[calc(100vh-4rem)] transition-all duration-200">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

