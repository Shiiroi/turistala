import type { MockPlace } from "../../travel/types";
import type { TravelStore } from "../../travel/types";
import { JournalPreviewList } from "../../travel/components/JournalPreviewList";

interface PanelJournalsViewProps {
    places: MockPlace[];
    store: TravelStore;
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
