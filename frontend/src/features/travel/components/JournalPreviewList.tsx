import { useMemo, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { MockJournal, MockPlace } from "../../travel/types";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";
import {
    JournalPhotoPicker,
    localPhotosToStorePhotos,
    type LocalPhoto,
} from "./JournalPhotoPicker";

const SIDEBAR_JOURNAL_LIMIT = 3;

interface JournalGroup {
    placeId: string;
    placeName: string;
    entries: MockJournal[];
}

function buildJournalGroups(
    places: MockPlace[],
    store: MockTravelStore,
): JournalGroup[] {
    const placeIds = new Set(places.map((p) => p.id));
    const placeNameById = new Map(places.map((p) => [p.id, p.name]));
    const entries = store.journals
        .filter((j) => placeIds.has(j.place_id))
        .sort((a, b) => b.visit_date.localeCompare(a.visit_date));

    const groupMap = new Map<string, JournalGroup>();
    for (const entry of entries) {
        const placeName =
            placeNameById.get(entry.place_id) ??
            store.places.find((p) => p.id === entry.place_id)?.name ??
            "Unknown place";
        const existing = groupMap.get(entry.place_id);
        if (existing) {
            existing.entries.push(entry);
        } else {
            groupMap.set(entry.place_id, {
                placeId: entry.place_id,
                placeName,
                entries: [entry],
            });
        }
    }

    return Array.from(groupMap.values());
}

interface JournalEntryListProps {
    groups: JournalGroup[];
    onOpenJournal: (journalId: string, placeId: string) => void;
    maxCards?: number;
    showPlaceHeaders?: boolean;
}

function JournalEntryList({
    groups,
    onOpenJournal,
    maxCards,
    showPlaceHeaders = true,
}: JournalEntryListProps) {
    let cardsShown = 0;

    return (
        <>
            {groups.map((group) => {
                const entriesToShow: MockJournal[] = [];
                for (const entry of group.entries) {
                    if (maxCards != null && cardsShown >= maxCards) break;
                    entriesToShow.push(entry);
                    cardsShown += 1;
                }

                if (entriesToShow.length === 0) return null;

                const showHeader = showPlaceHeaders;

                return (
                    <div key={group.placeId}>
                        {showHeader && (
                            <div className="journal-group__header">
                                <MapPin size={12} />
                                {group.placeName}
                                {group.entries.length > 1 && (
                                    <span style={{ opacity: 0.7 }}>
                                        · {group.entries.length} entries
                                    </span>
                                )}
                            </div>
                        )}
                        {entriesToShow.map((j) => (
                            <button
                                key={j.id}
                                type="button"
                                className="journal-preview-card"
                                onClick={() => onOpenJournal(j.id, j.place_id)}
                            >
                                <div className="journal-preview-card__title">{j.title}</div>
                                <div className="journal-preview-card__meta">
                                    <Calendar size={12} />
                                    <span>{j.visit_date}</span>
                                </div>
                                {j.content && (
                                    <p className="journal-preview-card__excerpt">{j.content}</p>
                                )}
                            </button>
                        ))}
                    </div>
                );
            })}
        </>
    );
}

interface JournalPreviewListProps {
    places: MockPlace[];
    store: MockTravelStore;
    onOpenJournal: (journalId: string, placeId: string) => void;
    /** When true, show full list with no sidebar cap or see-all modal */
    showAll?: boolean;
}

export function JournalPreviewList({
    places,
    store,
    onOpenJournal,
    showAll = false,
}: JournalPreviewListProps) {
    const [seeAllOpen, setSeeAllOpen] = useState(false);
    const groups = useMemo(() => buildJournalGroups(places, store), [places, store, store.journals]);
    const totalEntries = groups.reduce((sum, g) => sum + g.entries.length, 0);
    const limit = showAll ? undefined : SIDEBAR_JOURNAL_LIMIT;

    return (
        <div style={{ marginBottom: 16 }}>
            <div className="label-mono" style={{ marginBottom: 8 }}>
                Journals
            </div>
            {totalEntries === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    No journal entries in this area yet.
                </p>
            ) : (
                <>
                    <JournalEntryList
                        groups={groups}
                        onOpenJournal={onOpenJournal}
                        maxCards={limit}
                    />
                    {!showAll && totalEntries > SIDEBAR_JOURNAL_LIMIT && (
                        <button
                            type="button"
                            className="journal-see-all-btn"
                            onClick={() => setSeeAllOpen(true)}
                        >
                            See all ({totalEntries}) journals →
                        </button>
                    )}
                </>
            )}

            {!showAll && (
                <Modal
                    isOpen={seeAllOpen}
                    onClose={() => setSeeAllOpen(false)}
                    title="Journals"
                    size="lg"
                >
                    <JournalEntryList
                        groups={groups}
                        onOpenJournal={(journalId, placeId) => {
                            setSeeAllOpen(false);
                            onOpenJournal(journalId, placeId);
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}

interface QuickJournalFormProps {
    place: MockPlace;
    store: MockTravelStore;
    onCreated: (journalId: string) => void;
    onCancel: () => void;
    hideHeading?: boolean;
}

export function QuickJournalForm({
    place,
    store,
    onCreated,
    onCancel,
    hideHeading = false,
}: QuickJournalFormProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
    const [photos, setPhotos] = useState<LocalPhoto[]>([]);

    function handleSave() {
        const j = store.createJournal({
            place_id: place.id,
            title,
            content,
            visit_date: visitDate,
            photos: localPhotosToStorePhotos(photos),
        });
        onCreated(j.id);
    }

    return (
        <div
            style={{
                background: hideHeading ? "transparent" : "var(--bg-parchment)",
                border: hideHeading ? "none" : "1px solid var(--border-light)",
                borderRadius: hideHeading ? 0 : 8,
                padding: hideHeading ? 0 : 14,
                marginBottom: hideHeading ? 0 : 16,
            }}
        >
            {!hideHeading && (
                <div className="label-mono" style={{ marginBottom: 8 }}>
                    New journal · {place.name}
                </div>
            )}
            <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
            />
            <textarea
                placeholder="Write about your visit…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                style={{ ...inputStyle, marginTop: 8, resize: "vertical" }}
            />
            <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                style={{ ...inputStyle, marginTop: 8 }}
            />
            <JournalPhotoPicker photos={photos} onChange={setPhotos} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
                    Save
                </Button>
                <Button size="sm" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
};
