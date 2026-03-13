import { useState } from "react";
import toast from "react-hot-toast";
import { useGetJournalsByPlaceQuery } from "../slices/journalApiSlice";
import {
    useGetUserGoalsQuery,
    useAddUserGoalMutation,
    useRemoveUserGoalMutation,
    useUpdateUserGoalStatusMutation,
} from "../slices/goalApiSlice";
import { useGetMunicipalitiesQuery } from "../slices/geogSlice";
import JournalModal from "./JournalModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function MunicipalityDetails({ town, onClose, mapMode }) {
    const user = useSelector((state) => state.auth.user);

    const { data: municipalities = [] } = useGetMunicipalitiesQuery();

    // Goals and states
    const { data: response, isLoading: loadingJournals } =
        useGetJournalsByPlaceQuery(town.id, { skip: !user || !town?.id });
    const journals = response?.data || [];

    const { data: goalsResponse } = useGetUserGoalsQuery(undefined, {
        skip: !user,
    });
    const goals = goalsResponse?.data || [];

    // Get places added in this area (municipality or province)
    const townGoals = goals.filter((g) => {
        if (mapMode === "province") {
            const muni = municipalities.find((m) => m.id === g.municity_id);
            return muni && muni.province_id === town.id;
        }
        return g.municity_id === town.id;
    });

    const [addGoal, { isLoading: isAdding }] = useAddUserGoalMutation();
    const [removeGoal, { isLoading: isRemoving }] = useRemoveUserGoalMutation();
    const [updateGoalStatus] = useUpdateUserGoalStatusMutation();

    const [newPlaceName, setNewPlaceName] = useState("");
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState("");
    const [selectedGoalForJournals, setSelectedGoalForJournals] =
        useState(null);
    const [goalToDelete, setGoalToDelete] = useState(null);
    const [updatingGoalId, setUpdatingGoalId] = useState(null);
    const [filterTab, setFilterTab] = useState("all"); // 'all', 'visited', 'unvisited'

    const provinceMunicipalities =
        mapMode === "province"
            ? municipalities
                  .filter((m) => m.province_id === town.id)
                  .sort((a, b) => a.name.localeCompare(b.name))
            : [];

    const filteredGoals = townGoals.filter((g) => {
        if (filterTab === "visited") return g.is_visited;
        if (filterTab === "unvisited") return !g.is_visited;
        return true; // 'all'
    });

    const handleOpenJournals = (goal) => {
        setSelectedGoalForJournals(goal);
    };

    const closeJournalsModal = () => {
        setSelectedGoalForJournals(null);
    };

    const handleAddPlace = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error("You must be logged in to add destinations!");
            return;
        }
        if (!newPlaceName.trim()) return;

        let targetMunicityId = town.id;
        if (mapMode === "province") {
            if (!selectedMunicipalityId) {
                toast.error("Please select a municipality first");
                return;
            }
            targetMunicityId = selectedMunicipalityId;
        }

        document.body.style.cursor = "wait";
        try {
            await addGoal({
                municityId: targetMunicityId,
                name: newPlaceName.trim(),
            }).unwrap();
            setNewPlaceName(""); // clear input
            if (mapMode === "province") setSelectedMunicipalityId("");
            toast.success(`${newPlaceName.trim()} added to goals!`);
        } catch (err) {
            console.error("Failed to add place:", err);
            toast.error(err.data?.message || "Failed to add place");
        } finally {
            document.body.style.cursor = "default";
        }
    };

    const toggleVisitedStatus = async (goal) => {
        if (!user) {
            toast.error("You must be logged in to modify status!");
            return;
        }

        document.body.style.cursor = "wait";
        setUpdatingGoalId(goal.place_id);
        try {
            await updateGoalStatus({
                placeId: goal.place_id,
                isVisited: !goal.is_visited,
            }).unwrap();
            toast.success(
                goal.is_visited
                    ? "Marked as not visited"
                    : "Successfully marked as visited!",
            );
        } catch (err) {
            console.error("Failed to update visited status:", err);
            toast.error("Failed to update status");
        } finally {
            setUpdatingGoalId(null);
            document.body.style.cursor = "default";
        }
    };

    const handleRemovePlace = async (goal) => {
        if (!user) {
            toast.error("You must be logged in to modify destinations!");
            return;
        }
        setGoalToDelete(goal);
    };

    const confirmRemovePlace = async () => {
        if (!goalToDelete) return;

        document.body.style.cursor = "wait";
        try {
            await removeGoal({
                placeId: goalToDelete.place_id,
                municityId: goalToDelete.municity_id,
            }).unwrap();
            toast.success("Goal and related journal entries removed");
            setGoalToDelete(null);
        } catch (err) {
            console.error("Failed to remove place:", err);
            toast.error("Failed to remove place");
            setGoalToDelete(null);
        } finally {
            document.body.style.cursor = "default";
        }
    };

    const cancelRemovePlace = () => {
        setGoalToDelete(null);
    };

    return (
        <div className="text-white animate-fade-in relative h-full flex flex-col">
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-teal-400">
                        {town.name}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {mapMode === "province"
                            ? "Province"
                            : ["City", "HUC", "ICC"].includes(town.type)
                              ? "City"
                              : "Municipality"}
                        {!mapMode || mapMode === "municity"
                            ? town.type === "HUC" && town.region_name
                                ? ` • ${town.region_name}`
                                : town.province_name
                                  ? ` • ${town.province_name}`
                                  : ""
                            : ""}
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
                <div className="flex flex-col gap-2 mt-2">
                    <h3 className="text-xl font-bold border-b border-slate-700 pb-2">
                        Plan a Visit
                    </h3>
                    <form
                        onSubmit={handleAddPlace}
                        className="flex flex-col gap-2"
                    >
                        {mapMode === "province" ? (
                            <>
                                <input
                                    type="text"
                                    value={newPlaceName}
                                    onChange={(e) =>
                                        setNewPlaceName(e.target.value)
                                    }
                                    placeholder="e.g Daranak Falls, Boracay..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                />
                                <select
                                    value={selectedMunicipalityId}
                                    onChange={(e) =>
                                        setSelectedMunicipalityId(
                                            e.target.value,
                                        )
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none"
                                    style={{
                                        backgroundImage:
                                            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                                        backgroundPosition:
                                            "right 0.7rem center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundSize: "1.5em 1.5em",
                                    }}
                                >
                                    <option value="">
                                        -- Select City or Municipality --
                                    </option>
                                    {provinceMunicipalities.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    disabled={
                                        isAdding ||
                                        !newPlaceName.trim() ||
                                        !selectedMunicipalityId
                                    }
                                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isAdding
                                        ? "Adding..."
                                        : "+ Add Destination"}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={newPlaceName}
                                    onChange={(e) =>
                                        setNewPlaceName(e.target.value)
                                    }
                                    placeholder="e.g Daranak Falls, Boracay..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-teal-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isAdding || !newPlaceName.trim()}
                                    className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isAdding
                                        ? "Adding..."
                                        : "+ Add Destination"}
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* List of Places to Go */}
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-3 border-b border-slate-700 pb-2">
                        <h3 className="text-xl font-bold">
                            Exploring {town.name}
                        </h3>
                        <div className="flex gap-2">
                            {["all", "unvisited", "visited"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterTab(tab)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                        filterTab === tab
                                            ? "bg-teal-500 text-slate-900"
                                            : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
                                    (
                                    {tab === "all"
                                        ? townGoals.length
                                        : tab === "visited"
                                          ? townGoals.filter(
                                                (g) => g.is_visited,
                                            ).length
                                          : townGoals.filter(
                                                (g) => !g.is_visited,
                                            ).length}
                                    )
                                </button>
                            ))}
                        </div>
                    </div>

                    {townGoals.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">
                            No places added yet. Select a municipality above and
                            add a specific place you want to visit!
                        </p>
                    ) : filteredGoals.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">
                            No {filterTab} places found.
                        </p>
                    ) : (
                        filteredGoals.map((goal) => (
                            <div
                                key={goal.place_id}
                                className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">
                                            {goal.place_name}
                                        </h4>
                                        {mapMode === "province" && (
                                            <p className="text-xs text-slate-400">
                                                {municipalities.find(
                                                    (m) =>
                                                        m.id ===
                                                        goal.municity_id,
                                                )?.name || ""}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemovePlace(goal)}
                                        className="text-red-500 hover:text-red-400 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <button
                                    onClick={() => toggleVisitedStatus(goal)}
                                    disabled={updatingGoalId === goal.place_id}
                                    className={`w-full py-2 mb-4 text-sm font-bold rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-wait ${
                                        goal.is_visited
                                            ? "bg-amber-500/20 border-amber-500 text-amber-500 hover:bg-amber-500/30"
                                            : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                                    }`}
                                >
                                    {updatingGoalId === goal.place_id
                                        ? "Updating..."
                                        : goal.is_visited
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
                                        </div>

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
                                                            onClick={() =>
                                                                handleOpenJournals(
                                                                    goal,
                                                                )
                                                            }
                                                            className="bg-slate-900/50 p-3 rounded border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
                                                        >
                                                            <h5 className="text-sm font-semibold text-white">
                                                                {journal.title ||
                                                                    journal.place_name}
                                                            </h5>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                {new Date(
                                                                    journal.visit_date,
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ))
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleOpenJournals(goal)
                                                }
                                                className="w-full text-xs bg-slate-700 hover:bg-slate-600 px-2 py-2 rounded text-white mt-2 transition-colors"
                                            >
                                                {journals.filter(
                                                    (j) =>
                                                        j.place_name ===
                                                        goal.place_name,
                                                ).length > 0
                                                    ? "View / Add Entries"
                                                    : "+ Add First Entry"}
                                            </button>
                                        </div>
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

            {selectedGoalForJournals && (
                <JournalModal
                    goal={selectedGoalForJournals}
                    journals={journals}
                    loadingJournals={loadingJournals}
                    onClose={closeJournalsModal}
                />
            )}

            {goalToDelete && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-red-500/50 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-center p-6 space-y-6">
                        <div className="text-red-500 mb-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto"
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
                                Remove This Goal?
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Are you sure you want to remove this place? This
                                will{" "}
                                <span className="text-red-400 font-bold">
                                    permanently delete
                                </span>{" "}
                                all associated journal entries and photos. This
                                action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-slate-800">
                            <button
                                onClick={cancelRemovePlace}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemovePlace}
                                disabled={isRemoving}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRemoving ? "Deleting..." : "Yes, Delete All"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
