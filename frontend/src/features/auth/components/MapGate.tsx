// MapGate.tsx — Route guards for map access and auth-only redirects.

import { Navigate } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";
import { isDemoMode } from "../../travel/demoStorage";

export function MapGate({ children }: { children: React.ReactNode }) {
    const { data: session, isLoading } = useAuthSession();

    if (isLoading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-parchment text-muted">
                Loading…
            </div>
        );
    }

    if (session || isDemoMode()) {
        return <>{children}</>;
    }

    return <Navigate to="/" replace />;
}

export function AuthRedirect({ children }: { children: React.ReactNode }) {
    const { data: session, isLoading } = useAuthSession();

    if (isLoading) return null;
    if (session) return <Navigate to="/map" replace />;
    return <>{children}</>;
}
