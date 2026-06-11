import { useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { cn } from "../../../lib/cn";
import { useSaveFeedback, useToast } from "../../../hooks/useToast";
import type { MockJournal, MockPlace } from "../../travel/types";
import type { TravelStore } from "../../travel/types";
import {
    JournalPhotoPicker,
    type LocalPhoto,
} from "../../travel/components/JournalPhotoPicker";
import { localPhotosToJournalInput } from "../../travel/utils/journalPhotoUtils";
import { useAuthSession } from "../../auth/hooks/useAuthSession";
import { useUserStorageUsage } from "../../journal/hooks/useUserStorageUsage";

interface JournalDetailViewProps {
    journal: MockJournal;
    place: MockPlace;
    store: TravelStore;
    onBack: () => void;
}

const inputClassName =
    "w-full rounded-md border border-border bg-surface px-2.5 py-2 font-body text-sm text-primary outline-none";

function formatJournalDate(isoDate: string): string {
    try {
        const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return isoDate;
    }
}

function journalPhotosToLocal(photos: MockJournal["photos"]): LocalPhoto[] {
    return photos.map((p) => ({ id: p.id, preview_url: p.preview_url }));
}

export function JournalDetailView({ journal: initialJournal, place, store, onBack }: JournalDetailViewProps) {
    const showSaved = useSaveFeedback();
    const { error: toastError } = useToast();
    const { data: session } = useAuthSession();
    const { data: storageBytesUsed = 0 } = useUserStorageUsage(
        store.isDemo ? undefined : session?.user?.id,
    );
    const [editOpen, setEditOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [visitDate, setVisitDate] = useState("");
    const [editPhotos, setEditPhotos] = useState<LocalPhoto[]>([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const journal = store.journals.find((j) => j.id === initialJournal.id) ?? initialJournal;

    function openEdit() {
        setTitle(journal.title);
        setContent(journal.content);
        setVisitDate(journal.visit_date);
        setEditPhotos(journalPhotosToLocal(journal.photos));
        setEditOpen(true);
    }

    async function handleSave() {
        if (isSaving || !title.trim()) return;
        setIsSaving(true);
        try {
            await Promise.resolve(
                store.updateJournal(journal.id, {
                    title,
                    content,
                    visit_date: visitDate,
                    photos: localPhotosToJournalInput(editPhotos),
                }),
            );
            showSaved(store.isDemo);
            setEditOpen(false);
        } catch {
            toastError("Could not save journal");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await Promise.resolve(store.deleteJournal(journal.id));
            setDeleteOpen(false);
            onBack();
        } catch {
            toastError("Could not delete journal");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div
            className={cn(
                "rounded-xl border border-border px-[22px] pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),var(--shadow)]",
                "bg-[#faf4e8] bg-[repeating-linear-gradient(transparent,transparent_27px,rgba(192,98,47,0.07)_27px,rgba(192,98,47,0.07)_28px)] bg-[length:100%_28px] bg-[position:0_24px]",
            )}
        >
            <div className="mb-3.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                <Calendar size={14} />
                <span>{formatJournalDate(journal.visit_date)}</span>
                <span>·</span>
                <Badge>{place.name}</Badge>
            </div>

            <h2 className="mb-4 border-b border-border-light pb-3 font-display text-[28px] leading-tight text-primary">
                {journal.title}
            </h2>

            {journal.content ? (
                <p className="mb-5 min-h-20 whitespace-pre-wrap text-base leading-[1.75] text-primary">
                    {journal.content}
                </p>
            ) : (
                <p className="mb-5 min-h-20 whitespace-pre-wrap text-base italic leading-[1.75] text-muted">
                    No written entry yet.
                </p>
            )}

            {journal.photos.length > 0 && (
                <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
                    {journal.photos.map((p) => (
                        <img
                            key={p.id}
                            className="aspect-square w-full rounded-lg border border-border object-cover"
                            src={p.preview_url}
                            alt=""
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border-light pt-3">
                <Button size="sm" onClick={openEdit}>
                    <Pencil size={14} className="mr-1.5" />
                    Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 size={14} className="mr-1.5" />
                    Delete
                </Button>
            </div>

            <Modal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit journal entry"
                size="lg"
            >
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClassName}
                    placeholder="Title"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className={cn(inputClassName, "mt-2 resize-y")}
                    placeholder="Write about your visit…"
                />
                <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className={cn(inputClassName, "mt-2")}
                />
                <JournalPhotoPicker
                    photos={editPhotos}
                    onChange={setEditPhotos}
                    disabled={store.isDemo}
                    storageBytesUsed={storageBytesUsed}
                />
                <div className="mt-4 flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        loading={isSaving}
                        disabled={!title.trim() || isSaving}
                    >
                        Save
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete journal entry?" size="sm">
                <p className="mb-4 text-sm text-primary">This cannot be undone.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} loading={isDeleting} disabled={isDeleting}>
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
