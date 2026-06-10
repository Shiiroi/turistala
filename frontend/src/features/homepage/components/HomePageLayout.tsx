import type { ReactNode } from "react";

interface HomePageLayoutProps {
    mapSection: ReactNode;
    detailPanel: ReactNode;
    panelOpen: boolean;
}

export function HomePageLayout({ mapSection, detailPanel, panelOpen }: HomePageLayoutProps) {
    return (
        <div className="home-layout">
            <div className={`home-layout__map ${panelOpen ? "home-layout__map--panel-open" : ""}`}>
                {mapSection}
            </div>
            {panelOpen && (
                <>
                    <div className="home-layout__backdrop" aria-hidden />
                    <aside className="home-layout__panel">{detailPanel}</aside>
                </>
            )}
        </div>
    );
}
