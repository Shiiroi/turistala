// WelcomePage.tsx — Landing route offering demo, sign-in, and sign-up entry points.

import { Link, Navigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "../components/ui/Button";
import { AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { useAuthSession } from "../features/auth/hooks/useAuthSession";
import { setDemoMode } from "../features/travel/demoStorage";

export function WelcomePage() {
    const { data: session, isLoading } = useAuthSession();

    function tryDemo() {
        setDemoMode();
        window.location.href = "/map";
    }

    if (isLoading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-parchment text-muted">
                Loading…
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
                    <div className="flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <MapPin size={22} strokeWidth={2} />
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-primary lg:text-4xl">
                        Turistala
                    </h1>
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
