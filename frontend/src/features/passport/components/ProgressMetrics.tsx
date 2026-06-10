import type { PassportStats } from "../types";

interface ProgressMetricsProps {
    stats: PassportStats | null;
    loading?: boolean;
}

export function ProgressMetrics({ stats, loading }: ProgressMetricsProps) {
    if (loading) {
        return <div className="text-sm text-muted">Loading progress…</div>;
    }
    if (!stats) {
        return <div className="text-sm text-muted">No stats available</div>;
    }

    return (
        <div className="space-y-2">
            <h3 className="font-display text-lg font-semibold">Travel Progress</h3>
            <p className="text-sm text-primary">
                {stats.visitedMunicities} / {stats.totalMunicities} municipalities visited
            </p>
            <p className="text-sm text-muted">
                Overall: {Math.round(stats.overallCompletion * 100)}%
            </p>
        </div>
    );
}
