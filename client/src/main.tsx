import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "./trpc";
import { Router } from "./pages/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TRPCProvider>
      <Toaster />
      <Router />
    </TRPCProvider>
  </React.StrictMode>
);
