import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface PillTabOption<T extends string> {
    value: T;
    label: ReactNode;
}

interface PillTabsProps<T extends string> {
    value: T;
    options: PillTabOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export function PillTabs<T extends string>({
    value,
    options,
    onChange,
    className,
}: PillTabsProps<T>) {
    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={cn(
                            "cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs text-muted transition-[background,color,border-color] duration-150",
                            isActive && "border-accent bg-accent text-white",
                        )}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
