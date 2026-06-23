// PassportBooklet.tsx — Visual passport cover card in the live UI.

import { cn } from "../../../lib/cn";
import { TuristalaLogo } from "../../../components/TuristalaLogo";
import type { Region } from "../../map/types";
import { StylizedSunMark } from "./PassportDecor";
import { PhilippinesOutline } from "./PhilippinesOutline";

export interface PassportProgressLine {
    visited: number;
    total: number;
    label: string;
    pct: number | null;
}

interface PassportBookletProps {
    progressLines: PassportProgressLine[];
    username: string;
    initials: string;
    avatarUrl?: string | null;
    passportId: string;
    regions: Region[];
    className?: string;
}

export function PassportBooklet({
    progressLines,
    username,
    initials,
    avatarUrl,
    passportId,
    regions,
    className,
}: PassportBookletProps) {
    const regionGeometries = regions.map((r) => r.geometry);

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border-2 border-[#c8beb0] shadow-[var(--shadow-lg)]",
                className,
            )}
            style={{
                background: "linear-gradient(165deg, #faf4e8 0%, #ede3d2 45%, #e5d9c5 100%)",
            }}
        >
            <div className="relative border-b border-dashed border-[#c8beb0]/80 px-4 py-4 sm:px-5">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            transparent,
                            transparent 8px,
                            #c0622f 8px,
                            #c0622f 9px
                        )`,
                    }}
                />
                <div className="relative flex min-h-[52px] items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <TuristalaLogo size={26} />
                        <div className="min-w-0">
                            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                                Turistala
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                                Traveler Pass
                            </p>
                            <p
                                className="mt-1 font-mono text-[9px] text-muted"
                                title="Derived from your Supabase account ID — stable for your account, not stored in the database"
                            >
                                Doc. {passportId}
                            </p>
                        </div>
                    </div>
                    <PhilippinesOutline geometries={regionGeometries} size={52} />
                </div>
            </div>

            <div className="grid min-h-[100px] grid-cols-2 gap-4 px-4 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div
                        className={cn(
                            "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-16",
                            "border-2 border-[#c8beb0] bg-surface shadow-[inset_0_1px_3px_rgba(44,36,22,0.08)]",
                        )}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="size-full object-cover" />
                        ) : (
                            <span className="font-display text-lg font-bold text-accent sm:text-xl">
                                {initials}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
                            Bearer
                        </p>
                        <h3 className="truncate font-display text-lg font-semibold text-primary sm:text-xl">
                            {username}
                        </h3>
                    </div>
                </div>

                <div className="relative flex flex-col justify-center border-l border-[#c8beb0]/60 pl-4">
                    <StylizedSunMark
                        size={64}
                        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 opacity-25"
                    />
                    <div className="relative w-full space-y-1">
                        {progressLines.map((line) => (
                            <div
                                key={line.label}
                                className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 text-sm"
                            >
                                <span className="text-muted">
                                    {line.visited} / {line.total} {line.label}
                                </span>
                                {line.pct != null ? (
                                    <span className="font-semibold tabular-nums text-accent">
                                        {line.pct}%
                                    </span>
                                ) : (
                                    <span />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
