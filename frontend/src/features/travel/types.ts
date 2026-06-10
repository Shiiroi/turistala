export interface Place {
    id: string;
    osm_id: string;
    name: string;
    category?: string;
    municity_id: number;
    lat?: number;
    lng?: number;
}

export interface Goal {
    id: string;
    place_id: string;
    is_visited: boolean;
    visited_at?: string;
    added_at: string;
}

export interface VisitedPlace {
    id: string;
    place_id: string;
    visited_at: string;
}

export interface JournalPhoto {
    id: string;
    preview_url: string;
    display_order: number;
}

export interface Journal {
    id: string;
    place_id: string;
    title: string;
    content: string;
    visit_date: string;
    photos: JournalPhoto[];
    created_at: string;
}

export type PlaceStatus = "goal" | "visited";

export interface DemoTravelData {
    places: Place[];
    goals: Goal[];
    visited: VisitedPlace[];
    journals: Journal[];
}

export interface JournalPhotoInput {
    id?: string;
    preview_url: string;
    file?: File;
}

export interface TravelStore {
    places: Place[];
    goals: Goal[];
    visited: VisitedPlace[];
    journals: Journal[];
    goalMunicityIds: Set<number>;
    isDemo: boolean;
    isLoading: boolean;
    findPlaceByOsmId: (osm_id: string) => Place | undefined;
    addPlace: (place: Omit<Place, "id">) => Place | Promise<Place>;
    addAsGoal: (placeId: string) => void | Promise<void>;
    addAsVisited: (placeId: string) => void | Promise<void>;
    markGoalVisited: (goalId: string) => void | Promise<void>;
    removeGoal: (goalId: string) => void | Promise<void>;
    removeVisited: (visitedId: string) => void | Promise<void>;
    createJournal: (data: {
        place_id: string;
        title: string;
        content: string;
        visit_date: string;
        photos: JournalPhotoInput[];
    }) => Journal | Promise<Journal>;
    updateJournal: (
        journalId: string,
        data: Partial<Pick<Journal, "title" | "content" | "visit_date">> & {
            photos?: JournalPhotoInput[];
        },
    ) => void | Promise<void>;
    deleteJournal: (journalId: string) => void | Promise<void>;
    getPlaceStatus: (placeId: string) => PlaceStatus | null;
}

// Legacy aliases for gradual migration
export type MockPlace = Place;
export type MockGoal = Goal;
export type MockVisited = VisitedPlace;
export type MockJournal = Journal;
export type MockJournalPhoto = JournalPhoto;
