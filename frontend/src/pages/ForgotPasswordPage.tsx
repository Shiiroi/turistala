// Password reset request route.

import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthBackLink, AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { AuthBrandHeader } from "../features/auth/components/AuthBrandHeader";
import { useResetPasswordRequest } from "../features/auth/hooks/useAuthSession";

 // React component rendering ForgotPasswordPage.
export function ForgotPasswordPage() {
    const resetRequest = useResetPasswordRequest();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            await resetRequest.mutateAsync(email);
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset link");
        }
    }

    return (
        <AuthShell>
            <AuthCard>
                <AuthBrandHeader />
                <h1 className="mb-1 font-display text-2xl font-semibold text-primary">
                    Reset password
                </h1>
                <p className="mb-6 text-sm text-muted">
                    Enter your email and we&apos;ll send you a link to reset your password.
                </p>

                {sent ? (
                    <p className="rounded-lg border border-border-light bg-parchment px-3 py-2.5 text-sm text-muted">
                        Check your email for a password reset link.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            label="Email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="traveler@email.com"
                        />
                        {error && <p className="text-sm text-red-700">{error}</p>}
                        <Button
                            type="submit"
                            loading={resetRequest.isPending}
                            disabled={resetRequest.isPending}
                            className="w-full"
                        >
                            Send reset link
                        </Button>
                    </form>
                )}

                <AuthBackLink>
                    <Link to="/login" className="text-accent underline">
                        Back to sign in
                    </Link>
                </AuthBackLink>
            </AuthCard>
        </AuthShell>
    );
}
