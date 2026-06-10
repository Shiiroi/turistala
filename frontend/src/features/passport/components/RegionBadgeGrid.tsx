import type { RegionBadge } from "../types";
import { cn } from "../../../lib/cn";

interface RegionBadgeGridProps {
    badges: RegionBadge[];
    loading?: boolean;
}

export function RegionBadgeGrid({ badges, loading }: RegionBadgeGridProps) {
    if (loading) {
        return <div className="text-sm text-muted">Loading badges…</div>;
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {badges.map((badge) => (
                <div
                    key={badge.regionId}
                    className={cn(
                        "rounded-lg border-2 p-4 text-center",
                        badge.badgeEarned
                            ? "border-green-500 bg-green-100"
                            : "border-gray-300 bg-gray-50",
                    )}
                >
                    <div className="font-medium">{badge.regionName}</div>
                    <div className="text-xs text-gray-500">
                        {badge.visitedProvinces}/{badge.totalProvinces} provinces
                    </div>
                    {badge.badgeEarned && <div className="text-2xl">🏆</div>}
                </div>
            ))}
        </div>
    );
}
