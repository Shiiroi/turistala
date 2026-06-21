// SignupForm.tsx — Registration form with username, email, and password fields.

import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

interface SignupFormProps {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    error: string | null;
    isPending: boolean;
    onUsernameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function SignupForm({
    username,
    email,
    password,
    confirmPassword,
    error,
    isPending,
    onUsernameChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
}: SignupFormProps) {
    const usernameInvalid = username.length > 0 && !USERNAME_PATTERN.test(username);
    const passwordsMismatch =
        confirmPassword.length > 0 && password !== confirmPassword;

    return (
        <>
            <p className="mb-6 text-sm text-muted">
                Already have one?{" "}
                <Link to="/login" className="text-accent underline">
                    Sign in
                </Link>
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Input
                    label="Username"
                    type="text"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={20}
                    pattern="[a-z0-9_]{3,20}"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value.toLowerCase())}
                    placeholder="traveler"
                />
                {usernameInvalid && (
                    <p className="-mt-2 text-xs text-red-700">
                        3–20 characters: lowercase letters, numbers, underscores only
                    </p>
                )}
                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="traveler@email.com"
                />
                <Input
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••"
                />
                <Input
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => onConfirmPasswordChange(e.target.value)}
                    placeholder="••••••••"
                />
                {passwordsMismatch && (
                    <p className="-mt-2 text-xs text-red-700">Passwords do not match</p>
                )}
                {error && <p className="text-sm text-red-700">{error}</p>}
                <Button
                    type="submit"
                    loading={isPending}
                    disabled={isPending || usernameInvalid || passwordsMismatch}
                    className="w-full"
                >
                    Sign up
                </Button>
            </form>
        </>
    );
}

export { USERNAME_PATTERN };
