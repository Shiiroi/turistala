import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { supabase } from "../../../config/supabase";
import { useImportDemoMutation } from "../../travel/hooks/useAuthenticatedTravelStore";
import type { DemoTravelData } from "../../travel/types";
import { clearImportState, markImportDone, markImportDismissed, clearPendingImport, clearNewSignup } from "../../travel/demoStorage";

interface ImportDemoModalProps {
    isOpen: boolean;
    userId: string;
    demoData: DemoTravelData;
    onDone: () => void;
}

export function ImportDemoModal({ isOpen, userId, demoData, onDone }: ImportDemoModalProps) {
    const importDemo = useImportDemoMutation(userId);
    const [error, setError] = useState<string | null>(null);
    const [removeLocalAfterImport, setRemoveLocalAfterImport] = useState(true);

    async function handleImport() {
        setError(null);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                setError("You must be signed in to import. Please refresh and try again.");
                return;
            }
            await importDemo.mutateAsync(demoData);
            if (removeLocalAfterImport) {
                clearImportState(userId);
            } else {
                clearPendingImport();
                clearNewSignup();
                markImportDone(userId);
            }
            onDone();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed");
        }
    }

    function handleFresh() {
        clearImportState(userId);
        onDone();
    }

    function handleClose() {
        markImportDismissed();
        onDone();
    }

    const placeCount = demoData.places.length;
    const journalCount = demoData.journals.length;
    const goalCount = demoData.goals.length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import demo data?"
            subtitle={`${placeCount} place(s), ${goalCount} goal(s), ${journalCount} journal(s) saved on this device`}
            size="sm"
        >
            <p className="mb-3 text-sm text-muted">
                Demo mode keeps data in this browser only. Import it into your account to sync
                across devices, or start fresh with an empty account.
            </p>
            <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-primary">
                <input
                    type="checkbox"
                    checked={removeLocalAfterImport}
                    onChange={(e) => setRemoveLocalAfterImport(e.target.checked)}
                    className="mt-0.5"
                />
                <span>Remove demo data from this device after import</span>
            </label>
            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <Button onClick={handleImport} disabled={importDemo.isPending}>
                    {importDemo.isPending ? "Importing…" : "Import to my account"}
                </Button>
                <Button variant="secondary" onClick={handleFresh}>
                    Start fresh
                </Button>
            </div>
            <p className="mt-3 text-xs text-muted">
                &ldquo;Start fresh&rdquo; clears local demo data without importing.
            </p>
        </Modal>
    );
}

export function DemoBanner() {
    return (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-[1001] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[rgba(200,190,175,0.55)] bg-[rgba(250,246,238,0.94)] px-4 py-2 text-xs text-muted shadow-[0_2px_10px_rgba(44,36,22,0.06)] backdrop-blur-[10px]">
            <span>Demo mode — saved on this device only</span>
            <Link to="/signup">
                <Button size="sm" variant="primary">
                    Create free account
                </Button>
            </Link>
        </div>
    );
}
