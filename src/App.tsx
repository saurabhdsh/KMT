import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FabricProvider } from "./context/FabricContext";
import { ChatProvider } from "./context/ChatContext";
import { ToastProvider } from "./components/toast/ToastProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { FabricsPage } from "./pages/Fabrics/FabricsPage";
import { AvailableFabricsPage } from "./pages/Fabrics/AvailableFabricsPage";
import { ChatPage } from "./pages/Chat/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <FabricProvider>
        <ChatProvider>
          <ToastProvider>
            <AppLayout>
              <Routes>
            <Route path="/fabrics" element={<FabricsPage />} />
            <Route path="/available-fabrics" element={<AvailableFabricsPage />} />
            <Route path="/chat" element={<ChatPage />} />
                <Route path="*" element={<Navigate to="/fabrics" replace />} />
              </Routes>
            </AppLayout>
          </ToastProvider>
        </ChatProvider>
      </FabricProvider>
    </BrowserRouter>
  );
}

export default App;

