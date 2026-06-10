import type { MockPlace } from "../../travel/types";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";
import { JournalPreviewList } from "../../travel/components/JournalPreviewList";

interface PanelJournalsViewProps {
    places: MockPlace[];
    store: MockTravelStore;
    onOpenJournal: (journalId: string, placeId: string) => void;
}

export function PanelJournalsView({ places, store, onOpenJournal }: PanelJournalsViewProps) {
    return (
        <JournalPreviewList
            places={places}
            store={store}
            onOpenJournal={onOpenJournal}
            showAll
        />
    );
}
