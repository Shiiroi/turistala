import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    loading?: boolean;
    children: ReactNode;
}

const variantClasses = {
    primary: "bg-accent text-white",
    secondary: "bg-surface text-primary border border-border",
    ghost: "bg-transparent text-accent",
    danger: "bg-red-100 text-red-800",
};

const sizeClasses = {
    sm: "px-2.5 py-1 text-[13px]",
    md: "px-4 py-2 text-sm",
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md border-none font-body font-medium transition-[background,color] duration-150",
                isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            disabled={isDisabled}
            {...props}
        >
            {loading && <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />}
            {children}
        </button>
    );
}
