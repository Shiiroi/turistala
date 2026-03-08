import { useState, useRef } from "react";
import {
    useAddJournalEntryMutation,
    useUpdateJournalEntryMutation,
    useDeleteJournalEntryMutation,
} from "../slices/journalApiSlice";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export default function JournalEntryForm({
    townId,
    townName,
    onClose,
    existingEntry,
}) {
    const fileInputRef = useRef(null);
    const [notes, setNotes] = useState(
        existingEntry ? existingEntry.content : "",
    );
    const [localFiles, setLocalFiles] = useState([]);
    const [photos, setPhotos] = useState(
        existingEntry
            ? (existingEntry.photos || []).map((p) => p.storage_url || p)
            : [],
    );
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [addJournalEntry] = useAddJournalEntryMutation();
    const [updateJournalEntry] = useUpdateJournalEntryMutation();
    const [deleteJournalEntry] = useDeleteJournalEntryMutation();

    /**
     * Handles file input selection events.
     * Generates a temporary local ObjectURL for thumbnail preview purposes
     * without eagerly initiating network uploads.
     *
     * @param {Event} e - The HTML input change event.
     */
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);

        setLocalFiles([...localFiles, { file, objectUrl }]);
        setPhotos([...photos, objectUrl]);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    /**
     * Executes the form submission protocol.
     * Manages parallelized multipart uploads to cloud storage bucket
     * and maps resolved public URIs back to the respective entry payload
     * before delegating to the parent submission handler.
     *
     * @param {Event} e - Submit event.
     */
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            setUploading(true);

            const filesToUpload = localFiles.filter((lf) =>
                photos.includes(lf.objectUrl),
            );
            const uploadPromises = filesToUpload.map(async (localFile) => {
                const fileExt = localFile.file.name.split(".").pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { data, error } = await supabase.storage
                    .from("journal-photos")
                    .upload(filePath, localFile.file);

                if (error) throw error;

                const { data: publicURLData } = supabase.storage
                    .from("journal-photos")
                    .getPublicUrl(filePath);

                return {
                    objectUrl: localFile.objectUrl,
                    publicUrl: publicURLData.publicUrl,
                };
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setUploading(false);

            const finalPhotos = photos.map((photoUrl) => {
                const uploaded = uploadedUrls.find(
                    (u) => u.objectUrl === (photoUrl?.storage_url || photoUrl),
                );
                return uploaded ? uploaded.publicUrl : photoUrl;
            });

            if (existingEntry) {
                await updateJournalEntry({
                    journalId: existingEntry.id,
                    notes,
                    photos: finalPhotos,
                    municityId: townId,
                }).unwrap();
                toast.success("Journal entry updated!");
            } else {
                await addJournalEntry({
                    municityId: townId,
                    name: townName,
                    notes,
                    photos: finalPhotos,
                }).unwrap();
                toast.success("Journal entry added!");
            }

            localFiles.forEach((lf) => URL.revokeObjectURL(lf.objectUrl));

            onClose();
        } catch (err) {
            console.error("Failed to save journal:", err);
            toast.error("Failed to save journal entry.");
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (
            window.confirm(
                "Are you sure you want to delete this journal entry?",
            )
        ) {
            setLoading(true);
            try {
                await deleteJournalEntry({
                    journalId: existingEntry.id,
                    municityId: townId,
                }).unwrap();
                toast.success("Journal entry deleted!");
                onClose();
            } catch (err) {
                console.error("Failed to delete journal:", err);
                toast.error("Failed to delete journal entry.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <form
            onSubmit={handleSave}
            className="bg-slate-800 p-4 rounded-lg border border-slate-700 mt-4 animate-fade-in space-y-4"
        >
            <h4 className="text-teal-400 font-bold mb-2">
                {existingEntry ? "Edit Entry" : "New Entry"}
            </h4>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you do there?"
                className="w-full bg-slate-900 text-white rounded p-3 border border-slate-600 focus:border-teal-500 focus:outline-none min-h-[120px] resize-y"
                required
            />

            <div className="flex flex-col gap-2 mb-2">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    disabled={uploading}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-teal-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-500 file:text-slate-900 hover:file:bg-teal-400 file:cursor-pointer disabled:opacity-50"
                />
                {uploading && (
                    <span className="text-xs text-teal-400">
                        Uploading photo...
                    </span>
                )}
                <div className="text-xs text-slate-500 text-center">- OR -</div>
                <input
                    type="text"
                    placeholder="Paste a photo URL and press Enter..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (e.target.value.trim()) {
                                setPhotos([...photos, e.target.value.trim()]);
                                e.target.value = "";
                            }
                        }
                    }}
                />
            </div>

            {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {photos.map((photo, i) => (
                        <div key={i} className="relative group">
                            <img
                                src={photo.storage_url || photo}
                                alt={`Journal photo ${i}`}
                                className="w-full h-16 object-cover rounded border border-slate-600"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setPhotos(
                                        photos.filter((_, idx) => idx !== i),
                                    )
                                }
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-4 h-4 text-xs font-bold leading-none cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                <div>
                    {existingEntry && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-red-500 hover:text-red-400 text-sm mr-4"
                        >
                            Delete
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white px-3 py-1 font-medium transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !notes.trim()}
                        className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-900 px-4 py-1 rounded font-bold transition disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </form>
    );
}
