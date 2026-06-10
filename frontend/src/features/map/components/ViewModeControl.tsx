import type { MapMode } from "../../homepage/types";

interface ViewModeControlProps {
    mode: MapMode;
    municitiesLoading?: boolean;
    onModeChange: (mode: MapMode) => void;
}

const MODES: MapMode[] = ["region", "province", "municipality"];

export function ViewModeControl({ mode, municitiesLoading, onModeChange }: ViewModeControlProps) {
    return (
        <>
            <div className="label-mono map-tools-section__label">View by</div>
            <div className="segmented-control">
                {MODES.map((m) => (
                    <button
                        key={m}
                        type="button"
                        className={mode === m ? "active" : ""}
                        onClick={() => onModeChange(m)}
                        disabled={m === "municipality" && municitiesLoading}
                    >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                        {m === "municipality" && municitiesLoading ? "…" : ""}
                    </button>
                ))}
            </div>
        </>
    );
}
