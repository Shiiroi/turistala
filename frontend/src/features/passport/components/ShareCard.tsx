// ShareCard.tsx — Shareable passport completion summary card.

import type { PassportStats } from "../types";

interface ShareCardProps {
    stats: PassportStats | null;
    username?: string;
}

export function ShareCard({ stats, username }: ShareCardProps) {
    if (!stats) return null;

    return (
        <div className="mx-auto max-w-[400px] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-6 text-center text-white">
            <h3 className="font-display text-lg font-semibold text-white">
                {username ?? "Traveler"}'s Passport
            </h3>
            <div className="my-4 text-5xl font-bold">
                {Math.round(stats.overallCompletion * 100)}%
            </div>
            <p>Philippines Complete</p>
            <p className="text-sm opacity-80">
                {stats.visitedMunicities} of {stats.totalMunicities} municipalities
            </p>
        </div>
    );
}
