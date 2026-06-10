import { BookOpen, MapPin, Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { MockPlace, PlaceStatus } from "../../travel/types";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";

interface PlaceCardProps {
    place: MockPlace;
    status: PlaceStatus;
    store: MockTravelStore;
    onNewJournal?: (placeId: string) => void;
}

export function PlaceCard({ place, status, store, onNewJournal }: PlaceCardProps) {
    const goal = store.goals.find((g) => g.place_id === place.id && !g.is_visited);
    const journalCount = store.journals.filter((j) => j.place_id === place.id).length;

    return (
        <div
            style={{
                background: "var(--bg-parchment)",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                padding: 14,
                marginBottom: 10,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 3, color: "var(--accent)" }} />
                <div style={{ fontWeight: 500 }}>{place.name}</div>
            </div>
            {place.category && (
                <div className="badge" style={{ marginBottom: 8 }}>
                    {place.category}
                </div>
            )}
            <span className="badge" style={{ marginBottom: 8, display: "inline-block" }}>
                {status === "goal" ? "Unvisited" : "Visited"}
            </span>

            {status === "goal" && goal && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <Button size="sm" onClick={() => store.markGoalVisited(goal.id)}>
                        Mark as visited
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => store.removeGoal(goal.id)}>
                        Remove
                    </Button>
                </div>
            )}

            {status === "visited" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {onNewJournal && (
                        <Button size="sm" onClick={() => onNewJournal(place.id)}>
                            <Plus size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                            Journal
                        </Button>
                    )}
                    {journalCount > 0 && (
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                alignSelf: "center",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <BookOpen size={12} />
                            {journalCount} {journalCount === 1 ? "entry" : "entries"}
                        </span>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            const v = store.visited.find((x) => x.place_id === place.id);
                            if (v) store.removeVisited(v.id);
                        }}
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
    store: MockTravelStore;
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
        <div className="explore-section">
            <div className="explore-section__header">
                <div className="explore-section__title">Exploring {divisionName}</div>
            </div>
            <div className="place-filter-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={filter === tab.id ? "active" : ""}
                        onClick={() => onFilterChange(tab.id)}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>
            {filtered.length === 0 ? (
                <div className="place-empty-hint">
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
