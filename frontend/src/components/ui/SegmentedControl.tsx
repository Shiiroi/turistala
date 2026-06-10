import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface SegmentedControlOption<T extends string> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
    value: T;
    options: SegmentedControlOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export function SegmentedControl<T extends string>({
    value,
    options,
    onChange,
    className,
}: SegmentedControlProps<T>) {
    return (
        <div
            className={cn(
                "flex overflow-hidden rounded-md border border-border",
                className,
            )}
            role="group"
        >
            {options.map((option, index) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={option.disabled}
                        className={cn(
                            "flex-1 cursor-pointer border-none bg-surface px-3 py-1.5 text-[13px] text-muted transition-[background,color] duration-150",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            index < options.length - 1 && "border-r border-border",
                            isActive && "bg-accent font-medium text-white",
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
