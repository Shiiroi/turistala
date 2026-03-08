import { useState } from "react";
import { useGetJournalsByPlaceQuery } from "../slices/journalApiSlice";
import {
    useGetUserGoalsQuery,
    useAddUserGoalMutation,
    useRemoveUserGoalMutation,
    useUpdateUserGoalStatusMutation,
} from "../slices/goalApiSlice";
import JournalEntryForm from "./JournalEntryForm";

export default function MunicipalityDetails({ town, onClose }) {
    // Goals and states
    const { data: response, isLoading: loadingJournals } =
        useGetJournalsByPlaceQuery(town.id);
    const journals = response?.data || [];

    const { data: goalsResponse } = useGetUserGoalsQuery();
    const goals = goalsResponse?.data || [];

    // Get ALL places the user added in this specific municipality
    const townGoals = goals.filter((g) => g.municity_id === town.id);

    const [addGoal, { isLoading: isAdding }] = useAddUserGoalMutation();
    const [removeGoal] = useRemoveUserGoalMutation();
    const [updateGoalStatus] = useUpdateUserGoalStatusMutation();

    const [newPlaceName, setNewPlaceName] = useState("");
    const [addingJournalForPlace, setAddingJournalForPlace] = useState(null);
    const [editingJournal, setEditingJournal] = useState(null);

    const handleEdit = (journal, placeName) => {
        setEditingJournal(journal);
        setAddingJournalForPlace(placeName);
    };

    const closeForm = () => {
        setEditingJournal(null);
        setAddingJournalForPlace(null);
    };

    const handleAddPlace = async (e) => {
        e.preventDefault();
        if (!newPlaceName.trim()) return;
        try {
            await addGoal({
                municityId: town.id,
                name: newPlaceName.trim(),
            }).unwrap();
            setNewPlaceName(""); // clear input
        } catch (err) {
            console.error("Failed to add place:", err);
            alert(err.data?.message || "Failed to add place");
        }
    };

    const toggleVisitedStatus = async (goal) => {
        try {
            await updateGoalStatus({
                placeId: goal.place_id,
                isVisited: !goal.is_visited,
            }).unwrap();
        } catch (err) {
            console.error("Failed to update visited status:", err);
        }
    };

    const handleRemovePlace = async (placeId) => {
        if (window.confirm("Are you sure you want to remove this place?")) {
            try {
                await removeGoal(placeId).unwrap();
            } catch (err) {
                console.error("Failed to remove place:", err);
            }
        }
    };

    return (
        <div className="text-white animate-fade-in relative h-full flex flex-col">
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-teal-400">
                        {town.name}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {["City", "HUC", "ICC"].includes(town.type)
                            ? "City"
                            : "Municipality"}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-2xl transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
                {/* Add a specific Place Form */}
                <form onSubmit={handleAddPlace} className="flex gap-2">
                    <input
                        type="text"
                        value={newPlaceName}
                        onChange={(e) => setNewPlaceName(e.target.value)}
                        placeholder="e.g Daranak Falls, Tanay Highlands..."
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                    />
                    <button
                        type="submit"
                        disabled={isAdding || !newPlaceName.trim()}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAdding ? "..." : "+ Add"}
                    </button>
                </form>

                {/* List of Places to Go */}
                <div className="flex flex-col gap-4 mt-2">
                    <h3 className="text-xl font-bold border-b border-slate-700 pb-2">
                        My Places in {town.name}
                    </h3>

                    {townGoals.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">
                            No places added yet. Add a specific place you want
                            to visit!
                        </p>
                    ) : (
                        townGoals.map((goal) => (
                            <div
                                key={goal.place_id}
                                className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-lg font-bold text-white">
                                        {goal.place_name}
                                    </h4>
                                    <button
                                        onClick={() =>
                                            handleRemovePlace(goal.place_id)
                                        }
                                        className="text-red-500 hover:text-red-400 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <button
                                    onClick={() => toggleVisitedStatus(goal)}
                                    className={`w-full py-2 mb-4 text-sm font-bold rounded-lg border transition-colors ${
                                        goal.is_visited
                                            ? "bg-amber-500/20 border-amber-500 text-amber-500 hover:bg-amber-500/30"
                                            : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                                    }`}
                                >
                                    {goal.is_visited
                                        ? "✓ Marked as Visited"
                                        : "Mark as Visited"}
                                </button>

                                {/* Journal Section for this specific place */}
                                {goal.is_visited ? (
                                    <div className="mt-2 border-t border-slate-700 pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-teal-400">
                                                Journal Entries
                                            </span>
                                            {addingJournalForPlace !==
                                                goal.place_name && (
                                                <button
                                                    onClick={() =>
                                                        setAddingJournalForPlace(
                                                            goal.place_name,
                                                        )
                                                    }
                                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white"
                                                >
                                                    + Add Entry
                                                </button>
                                            )}
                                        </div>

                                        {addingJournalForPlace ===
                                        goal.place_name ? (
                                            <JournalEntryForm
                                                townId={town.id}
                                                townName={goal.place_name}
                                                onClose={closeForm}
                                                existingEntry={editingJournal}
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {loadingJournals ? (
                                                    <span className="text-xs text-slate-500">
                                                        Loading...
                                                    </span>
                                                ) : (
                                                    journals
                                                        .filter(
                                                            (j) =>
                                                                j.place_name ===
                                                                goal.place_name,
                                                        )
                                                        .map((journal) => (
                                                            <div
                                                                key={journal.id}
                                                                className="bg-slate-900/50 p-3 rounded border border-slate-700"
                                                            >
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-slate-400">
                                                                        {new Date(
                                                                            journal.updated_at,
                                                                        ).toLocaleDateString()}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEdit(
                                                                                journal,
                                                                                goal.place_name,
                                                                            )
                                                                        }
                                                                        className="text-teal-500 hover:text-teal-400"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                                                    {
                                                                        journal.content
                                                                    }
                                                                </p>
                                                            </div>
                                                        ))
                                                )}
                                                {journals.filter(
                                                    (j) =>
                                                        j.place_name ===
                                                        goal.place_name,
                                                ).length === 0 && (
                                                    <p className="text-xs text-slate-500 italic">
                                                        No entries yet.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 italic text-center mt-2">
                                        Mark as visited to unlock the travel
                                        journal!
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
