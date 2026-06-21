// useDemoImportPrompt.ts — State machine for the post-signup demo import modal.

import { useCallback, useState } from "react";
import { useAuthSession } from "./useAuthSession";
import {
    clearImportDismissed,
    getDemoDataForImport,
    isImportDone,
    isNewSignup,
    shouldOfferDemoImport,
} from "../../travel/demoStorage";
import type { DemoTravelData } from "../../travel/types";

export function useDemoImportPrompt() {
    const { data: session } = useAuthSession();
    const userId = session?.user.id;
    const [autoDismissed, setAutoDismissed] = useState(false);
    const [manualOffer, setManualOffer] = useState<DemoTravelData | null>(null);

    const autoDemoData =
        userId && shouldOfferDemoImport(userId) ? getDemoDataForImport() : null;
    const demoData = manualOffer ?? (autoDismissed ? null : autoDemoData);
    const showImportModal = Boolean(userId && demoData);

    const openImportModal = useCallback(() => {
        if (!userId) return;
        const data = getDemoDataForImport();
        if (!data) return;
        clearImportDismissed();
        setManualOffer(data);
        setAutoDismissed(false);
    }, [userId]);

    const dismiss = useCallback(() => {
        setAutoDismissed(true);
        setManualOffer(null);
    }, []);

    const complete = useCallback(() => {
        setAutoDismissed(true);
        setManualOffer(null);
    }, []);

    const canManualImport = Boolean(
        userId && getDemoDataForImport() && !isImportDone(userId),
    );

    return {
        showImportModal,
        demoData,
        userId,
        canManualImport,
        openImportModal,
        dismiss,
        complete,
        isNewSignup: isNewSignup(),
    };
}
