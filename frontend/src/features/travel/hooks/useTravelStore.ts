// Facade that selects demo or authenticated travel storage.

import { useAuthSession } from "../../auth/hooks/useAuthSession";
import { useAuthenticatedTravelStore } from "./useAuthenticatedTravelStore";
import { useDemoTravelStore } from "./useDemoTravelStore";
import type { TravelStore } from "../types";

 /**
  * React hook providing states and handlers for travelstore.
  * @returns Value or promise returned by useTravelStore.
 */
export function useTravelStore(): TravelStore {
    const { data: session } = useAuthSession();
    const demoStore = useDemoTravelStore();
    const authStore = useAuthenticatedTravelStore(session?.user.id ?? "");

    if (session?.user.id) {
        return authStore;
    }
    return demoStore;
}

export type { TravelStore };
