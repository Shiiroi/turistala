// Place cards and filtered place explore section.

import { BookOpen, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { PillTabs } from "../../../components/ui/PillTabs";
import { useToast } from "../../../hooks/useToast";
import type { MockPlace, PlaceStatus } from "../../travel/types";
import type { TravelStore } from "../../travel/types";

interface PlaceCardProps {
    place: MockPlace;
    status: PlaceStatus;
    store: TravelStore;
    onNewJournal?: (placeId: string) => void;
}

 // React component rendering PlaceCard.
export function PlaceCard({ place, status, store, onNewJournal }: PlaceCardProps) {
    const { error: toastError } = useToast();
    const [pendingAction, setPendingAction] = useState<"mark" | "remove" | "unmark" | null>(null);
    const goal = store.goals.find((g) => g.place_id === place.id && !g.is_visited);
    const journalCount = store.journals.filter((j) => j.place_id === place.id).length;

    async function handleMarkVisited() {
        if (!goal || pendingAction) return;
        setPendingAction("mark");
        try {
            await Promise.resolve(store.markGoalVisited(goal.id));
        } catch {
            toastError("Could not update place");
        } finally {
            setPendingAction(null);
        }
    }

    async function handleRemoveGoal() {
        if (!goal || pendingAction) return;
        setPendingAction("remove");
        try {
            await Promise.resolve(store.removeGoal(goal.id));
        } catch {
            toastError("Could not update place");
        } finally {
            setPendingAction(null);
        }
    }

    async function handleUnmarkVisited() {
        const v = store.visited.find((x) => x.place_id === place.id);
        if (!v || pendingAction) return;
        setPendingAction("unmark");
        try {
            await Promise.resolve(store.removeVisited(v.id));
        } catch {
            toastError("Could not update place");
        } finally {
            setPendingAction(null);
        }
    }

    return (
        <div className="mb-2.5 rounded-lg border border-border-light bg-parchment p-3.5">
            <div className="mb-1 flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
                <div className="font-medium">{place.name}</div>
            </div>
            {place.category && (
                <Badge className="mb-2">{place.category}</Badge>
            )}
            <Badge
                variant={status === "visited" ? "visited" : "default"}
                className="mb-2 inline-block"
            >
                {status === "goal" ? "Unvisited" : "Visited"}
            </Badge>

            {status === "goal" && goal && (
                <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        onClick={handleMarkVisited}
                        loading={pendingAction === "mark"}
                        disabled={pendingAction != null}
                    >
                        Mark as visited
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRemoveGoal}
                        loading={pendingAction === "remove"}
                        disabled={pendingAction != null}
                    >
                        Remove
                    </Button>
                </div>
            )}

            {status === "visited" && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {onNewJournal && (
                        <Button size="sm" onClick={() => onNewJournal(place.id)}>
                            <Plus size={14} className="mr-1 inline align-middle" />
                            Journal
                        </Button>
                    )}
                    {journalCount > 0 && (
                        <span className="inline-flex items-center gap-1 self-center text-xs text-muted">
                            <BookOpen size={12} />
                            {journalCount} {journalCount === 1 ? "entry" : "entries"}
                        </span>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleUnmarkVisited}
                        loading={pendingAction === "unmark"}
                        disabled={pendingAction != null}
                    >
                        Unmark visited
                    </Button>
                </div>
            )}
        </div>
    );
}

export type PlaceFilterTab = "all" | "unvisited" | "visited";

interface PlaceExploreSectionProps {
    divisionName: string;
    places: MockPlace[];
    store: TravelStore;
    filter: PlaceFilterTab;
    onFilterChange: (filter: PlaceFilterTab) => void;
    onNewJournal?: (placeId: string) => void;
}

export function PlaceExploreSection({
    divisionName,
    places,
    store,
    filter,
    onFilterChange,
    onNewJournal,
}: PlaceExploreSectionProps) {
    const destinations = places.filter((p) => store.getPlaceStatus(p.id) != null);
    const visited = destinations.filter((p) => store.getPlaceStatus(p.id) === "visited");
    const unvisited = destinations.filter((p) => store.getPlaceStatus(p.id) === "goal");

    const filtered = (() => {
        switch (filter) {
            case "all":
                return destinations;
            case "visited":
                return visited;
            case "unvisited":
                return unvisited;
        }
    })();

    const tabs: { id: PlaceFilterTab; label: string; count: number }[] = [
        { id: "all", label: "All", count: destinations.length },
        { id: "unvisited", label: "Unvisited", count: unvisited.length },
        { id: "visited", label: "Visited", count: visited.length },
    ];

    return (
        <div className="mb-4">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
                <div className="font-display text-[17px] font-semibold">
                    Exploring {divisionName}
                </div>
            </div>
            <PillTabs
                value={filter}
                onChange={onFilterChange}
                className="mb-3"
                options={tabs.map((tab) => ({
                    value: tab.id,
                    label: `${tab.label} (${tab.count})`,
                }))}
            />
            {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-parchment p-4 text-center text-[13px] italic text-muted">
                    No places added yet. Use Add a place above to start your list.
                </div>
            ) : (
                filtered.map((place) => {
                    const status = store.getPlaceStatus(place.id)!;
                    return (
                        <PlaceCard
                            key={place.id}
                            place={place}
                            status={status}
                            store={store}
                            onNewJournal={status === "visited" ? onNewJournal : undefined}
                        />
                    );
                })
            )}
        </div>
    );
}
