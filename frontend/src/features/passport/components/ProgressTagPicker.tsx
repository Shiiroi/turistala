import { cn } from "../../../lib/cn";
import { PASSPORT_PROGRESS_OPTIONS, type PassportProgressLevel } from "../types";

interface ProgressTagPickerProps {
    selected: PassportProgressLevel[];
    onChange: (next: PassportProgressLevel[]) => void;
    className?: string;
}

export function ProgressTagPicker({ selected, onChange, className }: ProgressTagPickerProps) {
    function toggle(level: PassportProgressLevel) {
        const isOn = selected.includes(level);
        if (isOn && selected.length === 1) return;
        onChange(isOn ? selected.filter((l) => l !== level) : [...selected, level]);
    }

    return (
        <div className={className}>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">Progress:</p>
            <div className="flex flex-wrap gap-3">
                {PASSPORT_PROGRESS_OPTIONS.map((option) => {
                    const isActive = selected.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            className={cn(
                                "cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-xs transition-[background,color,border-color] duration-150",
                                isActive
                                    ? "border-accent bg-accent text-white"
                                    : "border-border bg-surface text-muted hover:border-accent/40",
                            )}
                            onClick={() => toggle(option.value)}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
            <p className="mt-2 text-xs text-muted">
                Choose which progress lines appear on your passport card.
            </p>
        </div>
    );
}
