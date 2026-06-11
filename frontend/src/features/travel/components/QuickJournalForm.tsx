import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";
import { useSaveFeedback, useToast } from "../../../hooks/useToast";
import type { MockJournal, MockPlace, TravelStore } from "../types";
import { JournalPhotoPicker, type LocalPhoto } from "./JournalPhotoPicker";
import { useAuthSession } from "../../auth/hooks/useAuthSession";
import { useUserStorageUsage } from "../../journal/hooks/useUserStorageUsage";
import { localPhotosToJournalInput } from "../utils/journalPhotoUtils";

interface QuickJournalFormProps {
    place: MockPlace;
    store: TravelStore;
    onCreated: (journal: MockJournal) => void;
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
    const showSaved = useSaveFeedback();
    const { error: toastError } = useToast();
    const { data: session } = useAuthSession();
    const { data: storageBytesUsed = 0 } = useUserStorageUsage(
        store.isDemo ? undefined : session?.user?.id,
    );
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
    const [photos, setPhotos] = useState<LocalPhoto[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        if (isSaving || !title.trim()) return;
        setIsSaving(true);
        try {
            const j = await Promise.resolve(
                store.createJournal({
                    place_id: place.id,
                    title,
                    content,
                    visit_date: visitDate,
                    photos: localPhotosToJournalInput(photos),
                }),
            );
            showSaved(store.isDemo);
            onCreated(j);
        } catch {
            toastError("Could not save journal");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div
            className={cn(
                hideHeading ? "mb-0" : "mb-4 rounded-lg border border-border-light bg-parchment p-3.5",
            )}
        >
            {!hideHeading && (
                <Label className="mb-2">
                    New journal · {place.name}
                </Label>
            )}
            <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                placeholder="Write about your visit…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className={cn(
                    "mt-2 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 font-body text-sm text-primary outline-none",
                )}
            />
            <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="mt-2"
            />
            <JournalPhotoPicker
                photos={photos}
                onChange={setPhotos}
                disabled={store.isDemo}
                storageBytesUsed={storageBytesUsed}
            />
            <div className="mt-3 flex gap-2">
                <Button
                    size="sm"
                    onClick={handleSave}
                    loading={isSaving}
                    disabled={!title.trim() || isSaving}
                >
                    Save
                </Button>
                <Button size="sm" variant="secondary" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
