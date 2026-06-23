// AuthMapLoadingWaves.tsx — Sea-wave loading overlay for the auth map panel.

import { cn } from "../../../lib/cn";
import { AUTH_SEA_BG_CLASS } from "../constants/authSeaBackground";

interface AuthMapLoadingWavesProps {
    fading?: boolean;
}

export function AuthMapLoadingWaves({ fading = false }: AuthMapLoadingWavesProps) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden",
                AUTH_SEA_BG_CLASS,
                "transition-opacity duration-[400ms] ease-out",
                fading ? "opacity-0" : "opacity-100",
            )}
            aria-hidden
        >
            <svg
                className="auth-wave auth-wave--back absolute bottom-0 left-0 h-[42%] w-[200%] min-w-[800px]"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0,64 C150,96 350,32 600,64 C850,96 1050,32 1200,64 L1200,120 L0,120 Z"
                    fill="rgba(255,255,255,0.18)"
                />
            </svg>
            <svg
                className="auth-wave auth-wave--mid absolute bottom-0 left-0 h-[36%] w-[200%] min-w-[800px]"
                viewBox="0 0 1200 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0,56 C200,24 400,80 600,56 C800,32 1000,72 1200,56 L1200,100 L0,100 Z"
                    fill="rgba(255,255,255,0.28)"
                />
            </svg>
            <svg
                className="auth-wave auth-wave--front absolute bottom-0 left-0 h-[28%] w-[200%] min-w-[800px]"
                viewBox="0 0 1200 80"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0,40 C180,68 420,16 600,40 C780,64 1020,20 1200,40 L1200,80 L0,80 Z"
                    fill="rgba(255,255,255,0.38)"
                />
            </svg>
        </div>
    );
}
