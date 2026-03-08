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
    const [title, setTitle] = useState(
        existingEntry ? existingEntry.title : "",
    );
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        document.body.style.cursor = "wait";
        try {
            setUploading(true);

            const filesToUpload = localFiles.filter((lf) =>
                photos.includes(lf.objectUrl),
            );
            const uploadPromises = filesToUpload.map(async (localFile) => {
                const fileExt = localFile.file.name.split(".").pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error } = await supabase.storage
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
                    title,
                    notes,
                    photos: finalPhotos,
                    municityId: townId,
                }).unwrap();
                toast.success("Journal entry updated!");
            } else {
                await addJournalEntry({
                    municityId: townId,
                    name: townName,
                    title,
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
            document.body.style.cursor = "default";
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        document.body.style.cursor = "wait";
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
            document.body.style.cursor = "default";
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSave}
            className="w-full animate-fade-in space-y-4"
        >
            <h4 className="text-teal-400 font-bold mb-2">
                {existingEntry ? "Edit Entry" : "New Entry"}
            </h4>

            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Title (e.g. My Trip to ${townName})`}
                className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm text-white focus:outline-none focus:border-teal-500 mb-2"
            />

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
                            onClick={() => setShowDeleteConfirm(true)}
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
                        disabled={loading || uploading || !notes.trim()}
                        className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-900 px-4 py-1 rounded font-bold transition disabled:cursor-not-allowed"
                    >
                        {uploading
                            ? "Uploading Image..."
                            : loading
                              ? "Saving..."
                              : "Save"}
                    </button>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-red-500/50 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden text-center p-6 space-y-6">
                        <div className="text-red-500 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 mx-auto"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                Delete Journal Entry?
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Are you sure? This will{" "}
                                <span className="text-red-400 font-bold">
                                    permanently delete
                                </span>{" "}
                                the notes and attached photos.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
