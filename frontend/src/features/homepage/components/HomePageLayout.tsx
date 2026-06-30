// Split-view shell for the map and detail sidebar.

import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

interface HomePageLayoutProps {
    mapSection: ReactNode;
    detailPanel: ReactNode;
    panelOpen: boolean;
}

 // React component rendering HomePageLayout.
export function HomePageLayout({ mapSection, detailPanel, panelOpen }: HomePageLayoutProps) {
    return (
        <div className="relative flex h-dvh w-screen overflow-hidden bg-parchment">
            <div
                className={cn(
                    "relative flex-[1_1_100%] outline-none transition-[flex] duration-150 ease-out",
                    panelOpen && "md:flex-[0_0_62%] md:border-r md:border-border",
                )}
            >
                {mapSection}
            </div>
            {panelOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[900] hidden bg-[rgba(44,36,22,0.35)] max-md:block"
                        aria-hidden
                    />
                    <aside
                        data-sidebar
                        className={cn(
                            "select-none overflow-y-auto bg-surface [-webkit-overflow-scrolling:touch]",
                            "transition-[flex,transform] duration-150 ease-out",
                            "md:flex-[0_0_38%]",
                            "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-[901] max-md:w-full max-md:max-h-[88dvh] max-md:flex-none max-md:rounded-t-2xl max-md:border-t max-md:border-border max-md:shadow-[var(--shadow-lg)]",
                        )}
                    >
                        {detailPanel}
                    </aside>
                </>
            )}
        </div>
    );
}
