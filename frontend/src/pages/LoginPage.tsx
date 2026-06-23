// LoginPage.tsx — Email and password sign-in route.

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginForm } from "../features/auth/components/LoginForm";
import { AuthBackLink, AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { AuthBrandHeader } from "../features/auth/components/AuthBrandHeader";
import { useSignIn } from "../features/auth/hooks/useAuthSession";
import { clearDemoMode, isImportDone, clearDemoData } from "../features/travel/demoStorage";

export function LoginPage() {
    const navigate = useNavigate();
    const signIn = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            const result = await signIn.mutateAsync({ email, password });
            clearDemoMode();
            const userId = result.user?.id;
            if (userId && isImportDone(userId)) {
                clearDemoData();
            }
            navigate("/map");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign in failed");
        }
    }

    return (
        <AuthShell>
            <AuthCard>
                <AuthBrandHeader />
                <h1 className="mb-1 font-display text-2xl font-semibold text-primary">Sign in</h1>
                <LoginForm
                    email={email}
                    password={password}
                    error={error}
                    isPending={signIn.isPending}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onSubmit={handleSubmit}
                />
                <AuthBackLink>
                    <Link to="/" className="text-accent underline">
                        Back to welcome
                    </Link>
                </AuthBackLink>
            </AuthCard>
        </AuthShell>
    );
}
