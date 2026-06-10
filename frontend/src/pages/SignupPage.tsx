import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { SignupForm, USERNAME_PATTERN } from "../features/auth/components/SignupForm";
import { AuthBackLink, AuthCard, AuthShell } from "../features/auth/components/AuthShell";
import { useSignUp } from "../features/auth/hooks/useAuthSession";
import {
    clearDemoMode,
    exportDemoData,
    hasDemoData,
    markNewSignup,
    setPendingImport,
} from "../features/travel/demoStorage";

export function SignupPage() {
    const navigate = useNavigate();
    const signUp = useSignUp();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [confirmEmailMessage, setConfirmEmailMessage] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setConfirmEmailMessage(false);

        const normalizedUsername = username.trim().toLowerCase();
        if (!USERNAME_PATTERN.test(normalizedUsername)) {
            setError("Username must be 3–20 characters: lowercase letters, numbers, underscores only");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const snapshot = exportDemoData();
        const shouldImport = hasDemoData();
        try {
            const result = await signUp.mutateAsync({
                email,
                password,
                username: normalizedUsername,
            });
            clearDemoMode();

            if (shouldImport) {
                markNewSignup();
                setPendingImport(snapshot);
            }

            if (result.session) {
                navigate("/map");
            } else if (shouldImport) {
                setConfirmEmailMessage(true);
            } else {
                navigate("/login");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sign up failed";
            if (message.toLowerCase().includes("username") || message.includes("users_username_key")) {
                setError("That username is already taken. Please choose another.");
            } else {
                setError(message);
            }
        }
    }

    return (
        <AuthShell>
            <AuthCard>
                <h1 className="mb-1 font-display text-2xl font-semibold text-primary">
                    Create account
                </h1>
                <SignupForm
                    username={username}
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    error={error}
                    isPending={signUp.isPending}
                    onUsernameChange={setUsername}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onSubmit={handleSubmit}
                />

                {confirmEmailMessage && (
                    <p className="mt-4 rounded-lg border border-border-light bg-parchment px-3 py-2.5 text-sm text-muted">
                        Confirm your email, then sign in to import your demo data.
                    </p>
                )}

                <AuthBackLink>
                    <Link to="/" className="text-accent underline">
                        Back to welcome
                    </Link>
                </AuthBackLink>
            </AuthCard>
        </AuthShell>
    );
}
