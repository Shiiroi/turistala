import { useMemo, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Label } from "../../../components/ui/Label";
import { Modal } from "../../../components/ui/Modal";
import { cn } from "../../../lib/cn";
import type { MockJournal, MockPlace, TravelStore } from "../types";

const SIDEBAR_JOURNAL_LIMIT = 3;

interface JournalGroup {
    placeId: string;
    placeName: string;
    entries: MockJournal[];
}

function buildJournalGroups(
    places: MockPlace[],
    store: TravelStore,
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

interface FlatJournalGroup {
    group: JournalGroup;
    entries: MockJournal[];
}

function flattenJournalGroups(groups: JournalGroup[], maxCards?: number): FlatJournalGroup[] {
    if (maxCards == null) {
        return groups.map((group) => ({ group, entries: group.entries }));
    }

    let remaining = maxCards;
    const result: FlatJournalGroup[] = [];

    for (const group of groups) {
        if (remaining <= 0) break;
        const entries = group.entries.slice(0, remaining);
        remaining -= entries.length;
        if (entries.length > 0) {
            result.push({ group, entries });
        }
    }

    return result;
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
    const flatGroups = flattenJournalGroups(groups, maxCards);

    return (
        <>
            {flatGroups.map(({ group, entries: entriesToShow }) => {
                const showHeader = showPlaceHeaders;

                return (
                    <div key={group.placeId}>
                        {showHeader && (
                            <div className="mb-1.5 mt-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.03em] text-muted first:mt-0">
                                <MapPin size={12} />
                                {group.placeName}
                                {group.entries.length > 1 && (
                                    <span className="opacity-70">
                                        · {group.entries.length} entries
                                    </span>
                                )}
                            </div>
                        )}
                        {entriesToShow.map((j) => (
                            <button
                                key={j.id}
                                type="button"
                                className={cn(
                                    "mb-2 block w-full cursor-pointer rounded-lg border border-border-light border-l-[3px] border-l-accent bg-parchment px-3.5 py-3 text-left font-body",
                                    "transition-[border-color,box-shadow] duration-150 hover:border-border hover:shadow-[var(--shadow)]",
                                )}
                                onClick={() => onOpenJournal(j.id, j.place_id)}
                            >
                                <div className="mb-1 text-[15px] font-semibold">{j.title}</div>
                                <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
                                    <Calendar size={12} />
                                    <span>{j.visit_date}</span>
                                </div>
                                {j.content && (
                                    <p className="mt-1.5 truncate text-[13px] text-muted">
                                        {j.content}
                                    </p>
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
    store: TravelStore;
    onOpenJournal: (journalId: string, placeId: string) => void;
    // Full list — no sidebar cap or see-all modal
    showAll?: boolean;
}

export function JournalPreviewList({
    places,
    store,
    onOpenJournal,
    showAll = false,
}: JournalPreviewListProps) {
    const [seeAllOpen, setSeeAllOpen] = useState(false);
    const groups = useMemo(() => buildJournalGroups(places, store), [places, store]);
    const totalEntries = groups.reduce((sum, g) => sum + g.entries.length, 0);
    const limit = showAll ? undefined : SIDEBAR_JOURNAL_LIMIT;

    return (
        <div className="mb-4">
            <Label className="mb-2">Journals</Label>
            {totalEntries === 0 ? (
                <p className="text-[13px] text-muted">No journal entries in this area yet.</p>
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
                            className={cn(
                                "mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-center font-body text-[13px] text-accent",
                                "transition-[background,border-color] duration-150 hover:border-accent hover:bg-parchment",
                            )}
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
