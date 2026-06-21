// Input.tsx — Styled text input with optional label.
// Wraps a native input element with consistent border, typography, and spacing.

import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="font-mono text-[13px] font-medium text-muted">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    "rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-primary outline-none",
                    className,
                )}
                {...props}
            />
        </div>
    );
}
