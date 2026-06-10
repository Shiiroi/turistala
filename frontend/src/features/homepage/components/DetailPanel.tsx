import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import type { Division, JournalDetailContext, PanelBrowseTab, PanelMode } from "../types";
import { PanelHeader } from "./PanelHeader";
import { PanelEmptyState } from "./PanelEmptyState";
import { PanelBrowseView } from "./PanelBrowseView";
import { AddPlaceWizard } from "./AddPlaceWizard";
import { JournalDetailView } from "./JournalDetailView";
import { QuickJournalForm } from "../../travel/components/JournalPreviewList";
import type { PlaceFilterTab } from "../../travel/components/PlaceActions";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";
import type { ExploreViewTab } from "./DivisionExploreSection";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";

interface DetailPanelProps {
    selectedDivision: Division | null;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municities: MunicityGeoJSON[];
    municityMeta: MunicityMeta[];
    exploreViewTab: ExploreViewTab;
    onExploreViewTabChange: (tab: ExploreViewTab) => void;
    onSelectDivision: (division: Division) => void;
    onClose: () => void;
    travelStore: MockTravelStore;
}

export function DetailPanel({
    selectedDivision,
    regions,
    provinces,
    municities,
    municityMeta,
    exploreViewTab,
    onExploreViewTabChange,
    onSelectDivision,
    onClose,
    travelStore,
}: DetailPanelProps) {
    const [panelMode, setPanelMode] = useState<PanelMode>("browse");
    const [browseTab, setBrowseTab] = useState<PanelBrowseTab>("explore");
    const [returnBrowseTab, setReturnBrowseTab] = useState<PanelBrowseTab>("explore");
    const [statusFilter, setStatusFilter] = useState<PlaceFilterTab>("all");
    const [journalContext, setJournalContext] = useState<JournalDetailContext | null>(null);
    const [addPlaceOpen, setAddPlaceOpen] = useState(false);
    const [newJournalPlaceId, setNewJournalPlaceId] = useState<string | null>(null);

    useEffect(() => {
        setPanelMode("browse");
        setBrowseTab("explore");
        setReturnBrowseTab("explore");
        setStatusFilter("all");
        setJournalContext(null);
        setAddPlaceOpen(false);
        setNewJournalPlaceId(null);
    }, [selectedDivision?.id, selectedDivision?.level]);

    const existingOsmIds = useMemo(
        () => new Set(travelStore.places.map((p) => p.osm_id)),
        [travelStore.places],
    );

    if (!selectedDivision) {
        return <PanelEmptyState />;
    }

    const journalEntry =
        journalContext != null
            ? travelStore.journals.find((j) => j.id === journalContext.journalId)
            : null;
    const journalPlace =
        journalContext != null
            ? travelStore.places.find((p) => p.id === journalContext.placeId)
            : null;
    const newJournalPlace = newJournalPlaceId
        ? travelStore.places.find((p) => p.id === newJournalPlaceId)
        : null;

    function handleOpenJournal(journalId: string, placeId: string) {
        setReturnBrowseTab(browseTab);
        setJournalContext({ journalId, placeId });
        setPanelMode("journalDetail");
        setNewJournalPlaceId(null);
    }

    function handleBackFromJournal() {
        setPanelMode("browse");
        setBrowseTab(returnBrowseTab);
        setJournalContext(null);
    }

    return (
        <div className="detail-panel-inner" style={{ padding: "24px 28px" }}>
            {panelMode === "browse" && (
                <PanelBrowseView
                    selectedDivision={selectedDivision}
                    regions={regions}
                    provinces={provinces}
                    municities={municities}
                    municityMeta={municityMeta}
                    travelStore={travelStore}
                    browseTab={browseTab}
                    onBrowseTabChange={setBrowseTab}
                    viewTab={exploreViewTab}
                    onViewTabChange={onExploreViewTabChange}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    onSelectDivision={onSelectDivision}
                    onClose={onClose}
                    onAddPlace={() => setAddPlaceOpen(true)}
                    onOpenJournal={handleOpenJournal}
                    onNewJournal={(placeId) => setNewJournalPlaceId(placeId)}
                />
            )}

            {panelMode === "journalDetail" && journalEntry && journalPlace && (
                <>
                    <PanelHeader
                        onBack={handleBackFromJournal}
                        backLabel="Back"
                        onClose={onClose}
                    />
                    <JournalDetailView
                        journal={journalEntry}
                        place={journalPlace}
                        store={travelStore}
                        onBack={handleBackFromJournal}
                    />
                </>
            )}

            <Modal
                isOpen={addPlaceOpen}
                onClose={() => setAddPlaceOpen(false)}
                title="Add a place"
                size="xl"
            >
                <AddPlaceWizard
                    contextDivision={selectedDivision}
                    regions={regions}
                    provinces={provinces}
                    municityMeta={municityMeta}
                    travelStore={travelStore}
                    existingOsmIds={existingOsmIds}
                    hideHeading
                    onComplete={() => setAddPlaceOpen(false)}
                    onCancel={() => setAddPlaceOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={newJournalPlace != null}
                onClose={() => setNewJournalPlaceId(null)}
                title={newJournalPlace ? `New journal · ${newJournalPlace.name}` : "New journal"}
                size="lg"
            >
                {newJournalPlace && (
                    <QuickJournalForm
                        place={newJournalPlace}
                        store={travelStore}
                        hideHeading
                        onCreated={(journalId) => {
                            setNewJournalPlaceId(null);
                            handleOpenJournal(journalId, newJournalPlace.id);
                        }}
                        onCancel={() => setNewJournalPlaceId(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
