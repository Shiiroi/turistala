import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";
import { buildHeatmapPalette } from "../../travel/hooks/useMockHeatmapData";

interface HeatmapLegendProps {
    accentColor: string;
    onAccentColorChange: (color: string) => void;
}

export function HeatmapLegend({ accentColor, onAccentColorChange }: HeatmapLegendProps) {
    const palette = buildHeatmapPalette(accentColor);

    return (
        <>
            <Label className={cn("mb-1.5")}>Heatmap</Label>
            <div className="flex items-center gap-0.5">
                {palette.map((color, i) => (
                    <div
                        key={`${color}-${i}`}
                        title={`Level ${i}`}
                        className="h-3 w-6 border border-border-light transition-[background-color] duration-150"
                        style={{
                            background: color,
                            borderRadius:
                                i === 0
                                    ? "4px 0 0 4px"
                                    : i === palette.length - 1
                                      ? "0 4px 4px 0"
                                      : 0,
                        }}
                    />
                ))}
                <input
                    type="color"
                    value={accentColor}
                    title="Map accent color"
                    className="ml-2 size-7 cursor-pointer rounded border border-border bg-transparent p-0"
                    onInput={(e) => onAccentColorChange(e.currentTarget.value)}
                    onChange={(e) => onAccentColorChange(e.currentTarget.value)}
                />
            </div>
        </>
    );
}
