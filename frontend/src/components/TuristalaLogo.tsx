// TuristalaLogo.tsx — App logo from public/turistala.svg.

import { cn } from "../lib/cn";

const LOGO_SRC = "/turistala.svg";

interface TuristalaLogoProps {
    size?: number;
    className?: string;
    showWordmark?: boolean;
    wordmarkClassName?: string;
}

export function TuristalaLogo({
    size = 44,
    className,
    showWordmark = false,
    wordmarkClassName,
}: TuristalaLogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <img
                src={LOGO_SRC}
                alt="Turistala"
                width={size}
                height={size}
                className="shrink-0 object-contain"
                draggable={false}
            />
            {showWordmark && (
                <span
                    className={cn(
                        "font-display text-3xl font-semibold tracking-tight text-primary lg:text-4xl",
                        wordmarkClassName,
                    )}
                >
                    Turistala
                </span>
            )}
        </div>
    );
}

export const TURISTALA_LOGO_SRC = LOGO_SRC;
