import { useEffect, useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import type { MockJournal, MockPlace } from "../../travel/types";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";
import {
    JournalPhotoPicker,
    localPhotosToStorePhotos,
    type LocalPhoto,
} from "../../travel/components/JournalPhotoPicker";

interface JournalDetailViewProps {
    journal: MockJournal;
    place: MockPlace;
    store: MockTravelStore;
    onBack: () => void;
}

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
    const [editOpen, setEditOpen] = useState(false);
    const [title, setTitle] = useState(initialJournal.title);
    const [content, setContent] = useState(initialJournal.content);
    const [visitDate, setVisitDate] = useState(initialJournal.visit_date);
    const [editPhotos, setEditPhotos] = useState<LocalPhoto[]>([]);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const journal = store.journals.find((j) => j.id === initialJournal.id) ?? initialJournal;

    useEffect(() => {
        setTitle(journal.title);
        setContent(journal.content);
        setVisitDate(journal.visit_date);
    }, [journal.title, journal.content, journal.visit_date]);

    function openEdit() {
        setTitle(journal.title);
        setContent(journal.content);
        setVisitDate(journal.visit_date);
        setEditPhotos(journalPhotosToLocal(journal.photos));
        setEditOpen(true);
    }

    function handleSave() {
        store.updateJournal(journal.id, {
            title,
            content,
            visit_date: visitDate,
            photos: localPhotosToStorePhotos(editPhotos),
        });
        setEditOpen(false);
    }

    function handleDelete() {
        store.deleteJournal(journal.id);
        setDeleteOpen(false);
        onBack();
    }

    return (
        <div className="journal-page">
            <div className="journal-page__meta">
                <Calendar size={14} />
                <span>{formatJournalDate(journal.visit_date)}</span>
                <span>·</span>
                <span className="badge">{place.name}</span>
            </div>

            <h2 className="journal-page__title">{journal.title}</h2>

            {journal.content ? (
                <p className="journal-page__body">{journal.content}</p>
            ) : (
                <p className="journal-page__body" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    No written entry yet.
                </p>
            )}

            {journal.photos.length > 0 && (
                <div className="journal-page__photos">
                    {journal.photos.map((p) => (
                        <img
                            key={p.id}
                            className="journal-page__photo"
                            src={p.preview_url}
                            alt=""
                        />
                    ))}
                </div>
            )}

            <div className="journal-page__actions">
                <Button size="sm" onClick={openEdit}>
                    <Pencil size={14} style={{ marginRight: 6 }} />
                    Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
                    <Trash2 size={14} style={{ marginRight: 6 }} />
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
                    style={inputStyle}
                    placeholder="Title"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    style={{ ...inputStyle, marginTop: 8, resize: "vertical" }}
                    placeholder="Write about your visit…"
                />
                <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    style={{ ...inputStyle, marginTop: 8 }}
                />
                <JournalPhotoPicker photos={editPhotos} onChange={setEditPhotos} />
                <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
                    <Button size="sm" variant="secondary" onClick={() => setEditOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
                        Save
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete journal entry?" size="sm">
                <p style={{ marginBottom: 16, fontSize: 14 }}>This cannot be undone.</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
};
