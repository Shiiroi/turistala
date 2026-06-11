import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import type { Division, JournalDetailContext, PanelBrowseTab, PanelMode } from "../types";
import { PanelHeader } from "./PanelHeader";
import { PanelEmptyState } from "./PanelEmptyState";
import { PanelBrowseView } from "./PanelBrowseView";
import { AddPlaceWizard } from "./AddPlaceWizard";
import { JournalDetailView } from "./JournalDetailView";
import { QuickJournalForm } from "../../travel/components/QuickJournalForm";
import type { PlaceFilterTab } from "../../travel/components/PlaceActions";
import type { TravelStore } from "../../travel/types";
import type { Journal } from "../../travel/types";
import type { ExploreViewTab } from "./divisionExploreUtils";
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
    travelStore: TravelStore;
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
        const sel = window.getSelection();
        // #region agent log
        fetch("http://127.0.0.1:7624/ingest/396c05e2-f228-407a-9c62-2015f0b265e4", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "012611" },
            body: JSON.stringify({
                sessionId: "012611",
                location: "DetailPanel.tsx:useEffect",
                message: "panel division changed",
                data: {
                    divisionId: selectedDivision?.id,
                    divisionName: selectedDivision?.name,
                    selectionText: sel?.toString().slice(0, 80) ?? "",
                    selectionCollapsed: sel?.isCollapsed ?? true,
                    activeTag: document.activeElement?.tagName ?? "",
                },
                timestamp: Date.now(),
                hypothesisId: "D",
            }),
        }).catch(() => {});
        // #endregion
    }, [selectedDivision?.id, selectedDivision?.name]);

    const existingOsmIds = useMemo(
        () => new Set(travelStore.places.map((p) => p.osm_id)),
        [travelStore.places],
    );

    if (!selectedDivision) {
        return <PanelEmptyState />;
    }

    const journalEntry =
        journalContext != null
            ? travelStore.journals.find((j) => j.id === journalContext.journalId) ??
              journalContext.pendingJournal ??
              null
            : null;
    const journalPlace =
        journalContext != null
            ? travelStore.places.find((p) => p.id === journalContext.placeId)
            : null;
    const newJournalPlace = newJournalPlaceId
        ? travelStore.places.find((p) => p.id === newJournalPlaceId)
        : null;

    function handleOpenJournal(journalId: string, placeId: string, pendingJournal?: Journal) {
        setReturnBrowseTab(browseTab);
        setJournalContext({ journalId, placeId, pendingJournal });
        setPanelMode("journalDetail");
        setNewJournalPlaceId(null);
    }

    function handleBackFromJournal() {
        setPanelMode("browse");
        setBrowseTab(returnBrowseTab);
        setJournalContext(null);
    }

    return (
        <div className="px-7 py-6 max-md:pb-[max(24px,env(safe-area-inset-bottom))]">
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

            {panelMode === "journalDetail" && journalContext && (
                <>
                    <PanelHeader
                        onBack={handleBackFromJournal}
                        backLabel="Back"
                        onClose={onClose}
                    />
                    {journalEntry && journalPlace ? (
                        <JournalDetailView
                            key={journalEntry.id}
                            journal={journalEntry}
                            place={journalPlace}
                            store={travelStore}
                            onBack={handleBackFromJournal}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                            <Loader2 size={28} className="animate-spin text-accent" />
                            <p className="text-sm">Loading journal…</p>
                        </div>
                    )}
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
                        onCreated={(journal) => {
                            handleOpenJournal(journal.id, newJournalPlace.id, journal);
                        }}
                        onCancel={() => setNewJournalPlaceId(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
