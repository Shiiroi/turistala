import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./features/auth/components/AuthProvider";
import { ToastProvider, ToastViewport } from "./components/ui/Toast";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 10 min — data doesn't change often
            gcTime: 30 * 60 * 1000, // 30 min cache retention
            refetchOnWindowFocus: false, // don't refetch on tab focus
            retry: 2, // limit retries to avoid rate-limit issues
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <App />
                    <ToastViewport />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
