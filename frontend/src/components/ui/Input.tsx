import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {label && (
                <label
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    {label}
                </label>
            )}
            <input
                style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    outline: "none",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    ...style,
                }}
                {...props}
            />
        </div>
    );
}
