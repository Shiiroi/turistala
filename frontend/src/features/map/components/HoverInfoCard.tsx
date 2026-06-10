import type { Division } from "../../homepage/types";
import { divisionLevelLabel } from "../../homepage/types";

interface HoverInfoCardProps {
    hoveredDivision: Division | null;
}

const textShadow =
    "0 1px 3px rgba(251, 247, 240, 1), 0 0 12px rgba(251, 247, 240, 0.95), 0 2px 4px rgba(44, 36, 22, 0.15)";

export function HoverInfoCard({ hoveredDivision }: HoverInfoCardProps) {
    return (
        <div
            style={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 1000,
                maxWidth: 360,
                pointerEvents: "none",
            }}
        >
            {hoveredDivision ? (
                <>
                    <div
                        className="label-mono"
                        style={{
                            textShadow,
                            fontSize: 13,
                            letterSpacing: "0.06em",
                            color: "var(--text-primary)",
                        }}
                    >
                        {divisionLevelLabel(hoveredDivision.level)}
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 26,
                            fontWeight: 700,
                            marginTop: 6,
                            lineHeight: 1.15,
                            color: "var(--text-primary)",
                            textShadow,
                        }}
                    >
                        {hoveredDivision.name}
                    </div>
                </>
            ) : (
                <>
                    <div
                        className="label-mono"
                        style={{
                            textShadow,
                            fontSize: 13,
                            letterSpacing: "0.06em",
                            color: "var(--text-primary)",
                        }}
                    >
                        Turistala
                    </div>
                    <div
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 22,
                            fontWeight: 600,
                            marginTop: 6,
                            lineHeight: 1.2,
                            color: "var(--text-primary)",
                            textShadow,
                        }}
                    >
                        Explore the Philippines
                    </div>
                </>
            )}
        </div>
    );
}
