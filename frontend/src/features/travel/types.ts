export interface MockPlace {
    id: string;
    osm_id: string;
    name: string;
    category?: string;
    municity_id: number;
    lat?: number;
    lng?: number;
}

export interface MockGoal {
    id: string;
    place_id: string;
    is_visited: boolean;
    visited_at?: string;
    added_at: string;
}

export interface MockVisited {
    id: string;
    place_id: string;
    visited_at: string;
}

export interface MockJournalPhoto {
    id: string;
    preview_url: string;
    display_order: number;
}

export interface MockJournal {
    id: string;
    place_id: string;
    title: string;
    content: string;
    visit_date: string;
    photos: MockJournalPhoto[];
    created_at: string;
}

export type PlaceStatus = "goal" | "visited";
