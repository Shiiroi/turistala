// ViewModeControl.tsx — Segmented control for region, province, or municipality map mode.

import { Label } from "../../../components/ui/Label";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import type { MapMode } from "../../homepage/types";
import { cn } from "../../../lib/cn";

interface ViewModeControlProps {
    mode: MapMode;
    municitiesLoading?: boolean;
    onModeChange: (mode: MapMode) => void;
}

const MODES: MapMode[] = ["region", "province", "municipality"];

export function ViewModeControl({ mode, municitiesLoading, onModeChange }: ViewModeControlProps) {
    return (
        <>
            <Label className={cn("mb-1.5")}>View by</Label>
            <SegmentedControl
                value={mode}
                onChange={onModeChange}
                options={MODES.map((m) => ({
                    value: m,
                    label: (
                        <>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                            {m === "municipality" && municitiesLoading ? "…" : ""}
                        </>
                    ),
                    disabled: m === "municipality" && municitiesLoading,
                }))}
            />
        </>
    );
}
