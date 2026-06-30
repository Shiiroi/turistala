// Email and password sign-in form.

import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface LoginFormProps {
    email: string;
    password: string;
    error: string | null;
    isPending: boolean;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
    email,
    password,
    error,
    isPending,
    onEmailChange,
    onPasswordChange,
    onSubmit,
}: LoginFormProps) {
    return (
        <>
            <p className="mb-6 text-sm text-muted">
                Welcome back.{" "}
                <Link to="/signup" className="text-accent underline">
                    Create an account
                </Link>
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="••••••••"
                />
                <p className="-mt-2 text-right text-sm">
                    <Link to="/forgot-password" className="text-accent underline">
                        Forgot password?
                    </Link>
                </p>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <Button type="submit" loading={isPending} disabled={isPending} className="w-full">
                    Sign in
                </Button>
            </form>
        </>
    );
}
