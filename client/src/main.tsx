import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./api/query-client";
import { Router } from "./pages/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <Toaster
        toastOptions={{
          classNames: {
            closeButton: "bg-black text-white border-[#333333] w-6 h-6 hover:text-black duration-200 transition-colors",
          },
        }}
        closeButton
      />
      <Router />
    </QueryProvider>
  </React.StrictMode>
);
