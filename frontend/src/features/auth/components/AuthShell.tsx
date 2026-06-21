// AuthShell.tsx — Layout shell for authentication pages.

import type { ReactNode } from "react";
import { AuthMapPreview } from "./AuthMapPreview";
import { cn } from "../../../lib/cn";

interface AuthShellProps {
    children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
    return (
        <div className="flex min-h-dvh flex-col-reverse bg-parchment lg:flex-row">
            <div
                className={cn(
                    "flex flex-1 flex-col justify-center px-6 py-10 lg:w-[420px] lg:max-w-[420px] lg:shrink-0 lg:px-10 lg:py-12",
                )}
            >
                {children}
            </div>
            <div
                className={cn(
                    "relative h-[40vh] shrink-0 overflow-hidden lg:h-auto lg:min-h-dvh lg:flex-1",
                )}
            >
                <AuthMapPreview />
            </div>
        </div>
    );
}

interface AuthCardProps {
    children: ReactNode;
    className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
    return (
        <div className={cn("w-full max-w-sm lg:max-w-none", className)}>{children}</div>
    );
}

interface AuthBackLinkProps {
    children: ReactNode;
}

export function AuthBackLink({ children }: AuthBackLinkProps) {
    return (
        <p className="mt-6 border-t border-border-light pt-6 text-center text-sm text-muted">
            {children}
        </p>
    );
}
