import { useCallback, useEffect, useState } from "react";
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
    const [showImportModal, setShowImportModal] = useState(false);
    const [demoData, setDemoData] = useState<DemoTravelData | null>(null);

    useEffect(() => {
        if (!userId) {
            setShowImportModal(false);
            setDemoData(null);
            return;
        }

        if (shouldOfferDemoImport(userId)) {
            const data = getDemoDataForImport();
            if (data) {
                setDemoData(data);
                setShowImportModal(true);
            }
        }
    }, [userId]);

    const openImportModal = useCallback(() => {
        if (!userId) return;
        const data = getDemoDataForImport();
        if (!data) return;
        clearImportDismissed();
        setDemoData(data);
        setShowImportModal(true);
    }, [userId]);

    const dismiss = useCallback(() => {
        setShowImportModal(false);
    }, []);

    const complete = useCallback(() => {
        setShowImportModal(false);
        setDemoData(null);
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
