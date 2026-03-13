import React, { useState } from "react";
import JournalEntryForm from "./JournalEntryForm";
import { useDeleteJournalEntryMutation } from "../slices/journalApiSlice";
import { supabase } from "../supabaseClient";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

export default function JournalModal({
    goal,
    journals,
    loadingJournals,
    onClose,
}) {
    const user = useSelector((state) => state.auth.user);

    const [isAdding, setIsAdding] = useState(false);
    const [editingJournal, setEditingJournal] = useState(null);
    const [viewerImages, setViewerImages] = useState(null);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [journalToDelete, setJournalToDelete] = useState(null);

    const [deleteJournalEntry, { isLoading: isDeleting }] =
        useDeleteJournalEntryMutation();

    const placeJournals = journals.filter(
        (j) => j.place_name === goal.place_name,
    );

    const handleEdit = (journal) => {
        if (!user) {
            toast.error("You must be logged in to edit journals!");
            return;
        }
        setEditingJournal(journal);
        setIsAdding(true);
    };

    const handleDeleteClick = (journal) => {
        if (!user) {
            toast.error("You must be logged in to delete journals!");
            return;
        }
        setJournalToDelete(journal);
    };

    const confirmDelete = async () => {
        if (!journalToDelete) return;

        document.body.style.cursor = "wait";
        try {
            // Delete associated photos from storage first
            if (journalToDelete.photos && journalToDelete.photos.length > 0) {
                const pathsToDelete = journalToDelete.photos
                    .map((p) => {
                        const url = p.storage_url || p;
                        if (!url || typeof url !== "string") return null;
                        const matches = url.match(
                            /\/storage\/v1\/object\/public\/journal-photos\/(.+)$/,
                        );
                        return matches ? matches[1] : null;
                    })
                    .filter(Boolean);

                if (pathsToDelete.length > 0) {
                    await supabase.storage
                        .from("journal-photos")
                        .remove(pathsToDelete);
                }
            }

            // Then delete the entry
            await deleteJournalEntry(journalToDelete.id).unwrap();
            toast.success("Journal entry deleted");
            setJournalToDelete(null);
        } catch (err) {
            console.error("Failed to delete journal:", err);
            toast.error("Failed to delete journal.");
        } finally {
            document.body.style.cursor = "default";
        }
    };

    const handleCloseForm = () => {
        setEditingJournal(null);
        setIsAdding(false);
    };

    const openImageViewer = (photos, startIndex) => {
        setViewerImages(photos);
        setViewerIndex(startIndex);
    };

    const closeImageViewer = () => {
        setViewerImages(null);
        setViewerIndex(0);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        if (viewerImages && viewerIndex < viewerImages.length - 1) {
            setViewerIndex(viewerIndex + 1);
        }
    };

    const prevImage = (e) => {
        e.stopPropagation();
        if (viewerImages && viewerIndex > 0) {
            setViewerIndex(viewerIndex - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            {/* Full Screen Image Viewer */}
            {viewerImages && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/95 flex flex-col justify-center items-center"
                    onClick={closeImageViewer}
                >
                    <button
                        onClick={closeImageViewer}
                        className="absolute top-6 right-6 text-white bg-slate-800/50 hover:bg-slate-700 p-3 rounded-full transition-colors z-[10001]"
                    >
                        ✕
                    </button>

                    {viewerImages.length > 1 && (
                        <div className="absolute top-6 text-white z-[10001] bg-black/50 px-4 py-1 rounded-full text-sm">
                            {viewerIndex + 1} / {viewerImages.length}
                        </div>
                    )}

                    <div className="relative w-full h-full flex items-center justify-center max-w-5xl p-4">
                        {viewerIndex > 0 && (
                            <button
                                onClick={prevImage}
                                className="absolute left-4 md:left-8 text-white bg-slate-800/80 hover:bg-slate-700 p-4 rounded-full transition-colors z-[10001]"
                            >
                                ←
                            </button>
                        )}

                        <img
                            src={
                                viewerImages[viewerIndex]?.storage_url ||
                                viewerImages[viewerIndex]
                            }
                            alt={`Full view ${viewerIndex}`}
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {viewerIndex < viewerImages.length - 1 && (
                            <button
                                onClick={nextImage}
                                className="absolute right-4 md:right-8 text-white bg-slate-800/80 hover:bg-slate-700 p-4 rounded-full transition-colors z-[10001]"
                            >
                                →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-teal-400">
                            Journals: {goal.place_name}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-800"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!isAdding ? (
                        <>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white">
                                    Entries
                                </h3>
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            toast.error(
                                                "You must be logged in to create journals!",
                                            );
                                            return;
                                        }
                                        setIsAdding(true);
                                    }}
                                    className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                                >
                                    + Add New Entry
                                </button>
                            </div>

                            {loadingJournals ? (
                                <p className="text-slate-500 italic text-center py-8">
                                    Loading journals...
                                </p>
                            ) : placeJournals.length === 0 ? (
                                <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                    <p className="text-slate-400 mb-4">
                                        No journal entries yet.
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Document your experience at{" "}
                                        {goal.place_name}!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {placeJournals.map((journal) => (
                                        <div
                                            key={journal.id}
                                            className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
                                                <div className="flex flex-col">
                                                    <h4 className="text-white font-bold text-lg mb-1">
                                                        {journal.title ||
                                                            journal.place_name}
                                                    </h4>
                                                    <span className="text-teal-400 font-medium text-xs">
                                                        {new Date(
                                                            journal.visit_date,
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                weekday: "long",
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            },
                                                        )}
                                                    </span>
                                                    {journal.visit_date !==
                                                        journal.updated_at && (
                                                        <span className="text-slate-500 text-xs mt-0.5">
                                                            Updated:{" "}
                                                            {new Date(
                                                                journal.updated_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(journal)
                                                        }
                                                        className="text-teal-500 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1 rounded text-sm transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                journal,
                                                            )
                                                        }
                                                        className="text-red-500 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded text-sm transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {journal.content}
                                            </p>

                                            {/* Render Photos if any */}
                                            {journal.photos &&
                                                Array.isArray(journal.photos) &&
                                                journal.photos.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {journal.photos
                                                            .filter(
                                                                (p) =>
                                                                    p.storage_url ||
                                                                    p,
                                                            )
                                                            .map(
                                                                (
                                                                    photo,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        onClick={() =>
                                                                            openImageViewer(
                                                                                journal.photos.filter(
                                                                                    (
                                                                                        p,
                                                                                    ) =>
                                                                                        p.storage_url ||
                                                                                        p,
                                                                                ),
                                                                                idx,
                                                                            )
                                                                        }
                                                                        className="block aspect-square overflow-hidden rounded-lg border border-slate-600 hover:border-teal-500 transition-colors cursor-pointer"
                                                                    >
                                                                        <img
                                                                            src={
                                                                                photo.storage_url ||
                                                                                photo
                                                                            }
                                                                            alt={`Journal attachment ${idx}`}
                                                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                                        />
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-800 p-5 sm:p-6 rounded-xl border border-slate-700 shadow-sm">
                            <JournalEntryForm
                                townId={goal.municity_id}
                                townName={goal.place_name}
                                onClose={handleCloseForm}
                                existingEntry={editingJournal}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {journalToDelete && (
                <div className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 mx-auto">
                                <svg
                                    className="w-6 h-6 text-red-500"
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
                            <h3 className="text-xl font-bold text-center text-white mb-2">
                                Delete Journal Entry?
                            </h3>
                            <p className="text-center text-slate-400 text-sm leading-relaxed">
                                Are you sure? This will{" "}
                                <span className="text-red-400 font-bold">
                                    permanently delete
                                </span>{" "}
                                this entry and all its photos.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setJournalToDelete(null)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
