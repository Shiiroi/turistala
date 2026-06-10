import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthBackLink, AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { useUpdatePassword } from "../features/auth/hooks/useAuthSession";

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const updatePassword = useUpdatePassword();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await updatePassword.mutateAsync(password);
            navigate("/map");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update password");
        }
    }

    return (
        <AuthShell>
            <AuthCard>
                <h1 className="mb-1 font-display text-2xl font-semibold text-primary">
                    Set new password
                </h1>
                <p className="mb-6 text-sm text-muted">Choose a new password for your account.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    {passwordsMismatch && (
                        <p className="-mt-2 text-xs text-red-700">Passwords do not match</p>
                    )}
                    {error && <p className="text-sm text-red-700">{error}</p>}
                    <Button
                        type="submit"
                        disabled={updatePassword.isPending || passwordsMismatch}
                        className="w-full"
                    >
                        {updatePassword.isPending ? "Updating…" : "Update password"}
                    </Button>
                </form>

                <AuthBackLink>
                    <Link to="/login" className="text-accent underline">
                        Back to sign in
                    </Link>
                </AuthBackLink>
            </AuthCard>
        </AuthShell>
    );
}
