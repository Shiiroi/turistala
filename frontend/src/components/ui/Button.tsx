import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    children: ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    children,
    style,
    ...props
}: ButtonProps) {
    const baseStyle: React.CSSProperties = {
        padding: size === "sm" ? "4px 10px" : "8px 16px",
        borderRadius: 6,
        border: "none",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 500,
        fontSize: size === "sm" ? 13 : 14,
        fontFamily: "var(--font-body)",
        opacity: props.disabled ? 0.5 : 1,
        transition: "background 0.15s, color 0.15s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        ...style,
    };

    const variants: Record<string, React.CSSProperties> = {
        primary: { background: "var(--accent)", color: "white" },
        secondary: {
            background: "var(--surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
        },
        ghost: { background: "transparent", color: "var(--accent)" },
        danger: { background: "#fee2e2", color: "#991b1b" },
    };

    return (
        <button style={{ ...baseStyle, ...variants[variant] }} {...props}>
            {children}
        </button>
    );
}
