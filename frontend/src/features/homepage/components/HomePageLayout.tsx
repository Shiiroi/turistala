import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

interface HomePageLayoutProps {
    mapSection: ReactNode;
    detailPanel: ReactNode;
    panelOpen: boolean;
}

export function HomePageLayout({ mapSection, detailPanel, panelOpen }: HomePageLayoutProps) {
    return (
        <div className="relative flex h-dvh w-screen overflow-hidden bg-parchment">
            <div
                className={cn(
                    "relative flex-[1_1_100%] outline-none transition-[flex] duration-[250ms] ease-in-out",
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
                        onMouseUp={() => {
                            const sel = window.getSelection();
                            if (sel && !sel.isCollapsed && sel.toString().trim()) {
                                // #region agent log
                                fetch("http://127.0.0.1:7624/ingest/396c05e2-f228-407a-9c62-2015f0b265e4", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-Debug-Session-Id": "012611",
                                    },
                                    body: JSON.stringify({
                                        sessionId: "012611",
                                        location: "HomePageLayout.tsx:aside.mouseup",
                                        message: "sidebar text selection detected",
                                        data: {
                                            text: sel.toString().slice(0, 80),
                                            anchor: sel.anchorNode?.parentElement?.className?.slice(0, 60),
                                        },
                                        timestamp: Date.now(),
                                        hypothesisId: "A,B",
                                    }),
                                }).catch(() => {});
                                // #endregion
                            }
                        }}
                        className={cn(
                            "select-none overflow-y-auto bg-surface [-webkit-overflow-scrolling:touch]",
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
