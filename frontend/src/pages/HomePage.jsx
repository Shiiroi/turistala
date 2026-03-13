import { useState, useMemo, useEffect } from "react";
import { FaMap } from "react-icons/fa";
import Map from "../components/Map";
import {
    useGetMunicipalitiesQuery,
    useGetProvincesQuery,
} from "../slices/geogSlice";
import { useGetUserGoalsQuery } from "../slices/goalApiSlice";
import {
    useGetUserProfileQuery,
    useUpdateMapColorMutation,
} from "../slices/userApiSlice";
import { Loader } from "../components/Loader";
import MunicipalityDetails from "../components/MunicipalityDetails";
import { useSelector } from "react-redux";
import TopRightMenu from "../components/TopRightMenu";
import { toast } from "react-hot-toast";

const HomePage = () => {
    const token = useSelector((state) => state.auth.token);
    const [mapMode, setMapMode] = useState("municity"); // 'municity' or 'province'

    const {
        data: municipalities = [],
        isLoading: isMuniLoading,
        error: errorMuni,
    } = useGetMunicipalitiesQuery();

    const {
        data: provinces = [],
        isLoading: isProvLoading,
        error: errorProv,
    } = useGetProvincesQuery();

    const isLoading = mapMode === "municity" ? isMuniLoading : isProvLoading;
    const error = mapMode === "municity" ? errorMuni : errorProv;

    const mapData = mapMode === "municity" ? municipalities : provinces;

    const [activeTown, setActiveTown] = useState("");
    const [selectedTown, setSelectedTown] = useState(null);

    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

    const { data: userProfileData } = useGetUserProfileQuery(undefined, {
        skip: !token,
    });
    const [updateMapColor] = useUpdateMapColorMutation();
    const { data: userGoalsData } = useGetUserGoalsQuery(undefined, {
        skip: !token,
    });

    // Derive base color from user profile, using local state for optimistic updates
    const [localColor, setLocalColor] = useState(null);
    const baseColor =
        localColor || userProfileData?.data?.map_color || "#ec4899";

    /**
     * Propagates visual color shift to local state while triggering
     * an asynchronous server synchronization request.
     */
    const handleColorChange = async (colorHex) => {
        if (!token) {
            toast.error("Sign in to save colorful maps!");
            return;
        }

        setLocalColor(colorHex);
        try {
            await updateMapColor(colorHex).unwrap();
        } catch (error) {
            console.error("Failed to save map color", error);
            toast.error("Failed to save map color");
        }
    };

    const municipalityStats = useMemo(() => {
        const stats = {};
        if (userGoalsData?.data) {
            userGoalsData.data.forEach((goal) => {
                if (mapMode === "municity") {
                    if (!stats[goal.municity_id]) {
                        stats[goal.municity_id] = { total: 0, visited: 0 };
                    }
                    stats[goal.municity_id].total += 1;
                    if (goal.is_visited) {
                        stats[goal.municity_id].visited += 1;
                    }
                } else {
                    // Find the municipality to get its province_id
                    const muni = municipalities.find(
                        (m) => m.id === goal.municity_id,
                    );
                    if (muni && muni.province_id) {
                        if (!stats[muni.province_id]) {
                            stats[muni.province_id] = { total: 0, visited: 0 };
                        }
                        stats[muni.province_id].total += 1;
                        if (goal.is_visited) {
                            stats[muni.province_id].visited += 1;
                        }
                    }
                }
            });
        }
        return stats;
    }, [userGoalsData, mapMode, municipalities]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setSelectedTown(null); // Closes the sidebar
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="relative w-full h-screen bg-slate-900">
            {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader />
                </div>
            ) : error ? (
                <div className="w-full h-full flex items-center justify-center text-red-500 font-mono text-xl">
                    Error: {error?.data?.message || "Failed to load map data"}
                </div>
            ) : (
                <div className="flex h-full">
                    <div
                        className={`relative transition-all duration-500 ease-in-out ${selectedTown ? "w-2/3" : "w-full"} h-full`}
                    >
                        {/* HUD Overlay - displays current municipality name and instructions */}
                        <div className="absolute top-10 left-10 z-[1000] pointer-events-none">
                            <h1 className="text-6xl font-black text-white uppercase tracking-tighter opacity-80">
                                {activeTown || selectedTown?.name || "EXPLORE"}
                            </h1>
                            {!selectedTown && (
                                <p className="text-lg text-slate-400 font-mono mt-2">
                                    Click a municipality to view details
                                </p>
                            )}
                        </div>

                        {/* --- INJECT THE TOP RIGHT MENU HERE --- */}
                        <TopRightMenu
                            userProfileData={userProfileData}
                            hideMenu={!!selectedTown}
                            mapMode={mapMode}
                            mapData={mapData}
                            onSelectPlace={(place) => {
                                setSelectedTown(place);
                                // Optionally, you can also setActiveTown(place.name) if you want the HUD to update immediately
                            }}
                        />

                        <div className="absolute bottom-10 left-10 z-[1000] flex flex-col gap-2 pointer-events-auto">
                            <div className="relative w-fit flex flex-col justify-end">
                                <div
                                    className={`absolute bottom-full left-0 mb-3 bg-slate-800/90 backdrop-blur p-3 rounded-xl border border-slate-700 shadow-xl transition-all duration-300 origin-bottom-left w-max ${
                                        isColorMenuOpen
                                            ? "opacity-100 scale-100 visible"
                                            : "opacity-0 scale-95 invisible"
                                    }`}
                                >
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { name: "Black", hex: "#000000" },
                                            { name: "Indigo", hex: "#4f46e5" },
                                            { name: "Brown", hex: "#8b4513" },
                                            { name: "Pink", hex: "#ec4899" },
                                            { name: "Red", hex: "#ef4444" },
                                            { name: "Orange", hex: "#f97316" },
                                            { name: "Yellow", hex: "#eab308" },
                                            { name: "Green", hex: "#22c55e" },
                                            { name: "Teal", hex: "#14b8a6" },
                                            { name: "Cyan", hex: "#06b6d4" },
                                            { name: "Blue", hex: "#3b82f6" },
                                            { name: "Purple", hex: "#a855f7" },
                                        ].map((color) => (
                                            <button
                                                key={color.hex}
                                                title={color.name}
                                                onClick={() =>
                                                    handleColorChange(color.hex)
                                                }
                                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                                    baseColor === color.hex
                                                        ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                        : "border-transparent"
                                                }`}
                                                style={{
                                                    backgroundColor: color.hex,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() =>
                                        setIsColorMenuOpen(!isColorMenuOpen)
                                    }
                                    className="bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur pl-3 pr-4 py-2 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 transition-colors w-fit"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-slate-500"
                                        style={{ backgroundColor: baseColor }}
                                    />
                                    <span className="text-white text-sm font-semibold">
                                        Map Color
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setMapMode((m) =>
                                        m === "municity"
                                            ? "province"
                                            : "municity",
                                    );
                                    setSelectedTown(null); // Clear selection on mode change
                                }}
                                className="bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 transition-colors w-fit"
                            >
                                <FaMap className="text-teal-400" />
                                <span className="text-white text-sm font-semibold">
                                    {mapMode === "municity"
                                        ? "Municities Mode"
                                        : "Province Mode"}
                                </span>
                            </button>
                        </div>

                        <Map
                            municipalities={mapData}
                            onHover={setActiveTown}
                            onSelect={setSelectedTown}
                            selectedTown={selectedTown}
                            baseColor={baseColor}
                            municipalityStats={municipalityStats}
                            mapMode={mapMode}
                        />
                    </div>

                    <div
                        className={`h-full bg-slate-800 border-l border-slate-700 overflow-hidden transition-all duration-500 ease-in-out ${
                            selectedTown ? "w-1/3 p-8" : "w-0 p-0"
                        }`}
                    >
                        {selectedTown && (
                            <MunicipalityDetails
                                town={selectedTown}
                                mapMode={mapMode}
                                onClose={() => setSelectedTown(null)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
