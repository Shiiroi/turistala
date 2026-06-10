import { buildHeatmapPalette } from "../../travel/hooks/useMockHeatmapData";

interface HeatmapLegendProps {
    accentColor: string;
    onAccentColorChange: (color: string) => void;
}

export function HeatmapLegend({ accentColor, onAccentColorChange }: HeatmapLegendProps) {
    const palette = buildHeatmapPalette(accentColor);

    return (
        <>
            <div className="label-mono map-tools-section__label">Heatmap</div>
            <div className="map-tools-heatmap-row">
                {palette.map((color, i) => (
                    <div
                        key={`${color}-${i}`}
                        title={`Level ${i}`}
                        className="map-tools-heatmap-swatch"
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
                    className="map-tools-color-input"
                    onInput={(e) => onAccentColorChange(e.currentTarget.value)}
                    onChange={(e) => onAccentColorChange(e.currentTarget.value)}
                />
            </div>
        </>
    );
}
