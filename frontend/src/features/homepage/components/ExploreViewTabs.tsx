import { PillTabs } from "../../../components/ui/PillTabs";
import type { ExploreViewTab } from "./divisionExploreUtils";

const VIEW_TAB_LABELS: Record<ExploreViewTab, string> = {
    provinces: "Provinces",
    municipalities: "Municipalities",
    places: "Places",
};

interface ExploreViewTabsProps {
    tabs: ExploreViewTab[];
    active: ExploreViewTab;
    onChange: (tab: ExploreViewTab) => void;
}

export function ExploreViewTabs({ tabs, active, onChange }: ExploreViewTabsProps) {
    if (tabs.length <= 1) return null;

    return (
        <PillTabs
            value={active}
            options={tabs.map((tab) => ({ value: tab, label: VIEW_TAB_LABELS[tab] }))}
            onChange={onChange}
            className="mb-2.5 mt-3.5"
        />
    );
}
