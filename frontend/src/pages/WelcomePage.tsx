// WelcomePage.tsx — Landing route offering demo, sign-in, and sign-up entry points.

import { Link, Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { TuristalaLogo } from "../components/TuristalaLogo";
import { AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { AuthMapLoadingWaves } from "../features/auth/components/AuthMapLoadingWaves";
import { AUTH_SEA_BG_CLASS } from "../features/auth/constants/authSeaBackground";
import { useAuthSession } from "../features/auth/hooks/useAuthSession";
import { setDemoMode } from "../features/travel/demoStorage";
import { cn } from "../lib/cn";

export function WelcomePage() {
    const { data: session, isLoading } = useAuthSession();

    function tryDemo() {
        setDemoMode();
        window.location.href = "/map";
    }

    if (isLoading) {
        return (
            <div
                className={cn(
                    "auth-map-panel relative flex min-h-dvh items-center justify-center text-primary/70",
                    AUTH_SEA_BG_CLASS,
                )}
            >
                <div className={cn("pointer-events-none absolute inset-0", AUTH_SEA_BG_CLASS)} aria-hidden />
                <AuthMapLoadingWaves />
                <p className="relative z-10 text-sm">Loading…</p>
            </div>
        );
    }

    if (session) {
        return <Navigate to="/map" replace />;
    }

    return (
        <AuthShell>
            <AuthCard>
                <div className="mb-8 flex flex-col gap-3">
                    <TuristalaLogo size={48} showWordmark />
                    <p className="text-[15px] leading-relaxed text-muted">
                        Journal your Philippine travels
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button className="w-full py-3 text-base" onClick={tryDemo}>
                        Try demo
                    </Button>
                    <p className="text-xs leading-relaxed text-muted">
                        Demo saves on this device only. Create an account to sync everywhere.
                    </p>

                    <div className="my-2 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border-light" />
                        <span className="text-xs text-muted">or</span>
                        <div className="h-px flex-1 bg-border-light" />
                    </div>

                    <Link to="/login" className="w-full">
                        <Button variant="secondary" className="w-full py-2.5">
                            Sign in
                        </Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                        <Button variant="ghost" className="w-full py-2.5">
                            Create free account
                        </Button>
                    </Link>
                </div>
            </AuthCard>
        </AuthShell>
    );
}
