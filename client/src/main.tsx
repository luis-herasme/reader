import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "./trpc";
import { Router } from "./pages/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TRPCProvider>
      <Toaster
        toastOptions={{
          classNames: {
            closeButton: "bg-black text-white border-[#333333] w-6 h-6",
          },
        }}
        closeButton
      />
      <Router />
    </TRPCProvider>
  </React.StrictMode>
);
