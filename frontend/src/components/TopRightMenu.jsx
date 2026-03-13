import { useState, useRef, useEffect } from "react";
import {
    FaSearch,
    FaSignOutAlt,
    FaSignInAlt,
    FaSpinner,
    FaCheckCircle,
    FaExclamationCircle,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../slices/authSlice";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

const stringSimilarity = (a, b) => {
    // Simple Levenshtein distance for fuzzy matching
    if (!a || !b) return 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 1;
    if (a.startsWith(b) || b.startsWith(a)) return 0.95;
    let matrix = [];
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    const lev = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return 1 - lev / maxLen;
};

const TopRightMenu = ({ userProfileData, hideMenu, mapMode, mapData, onSelectPlace }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = useSelector((state) => state.auth.token);
    const isLoggedIn = !!token;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const menuRef = useRef(null);

    // Ref for each result to scroll into view
    const resultRefs = useRef([]);

    const userName = userProfileData?.data?.username || "Guest User";
    const userEmail = userProfileData?.data?.email || "Not signed in";
    const avatarSrc =
        userProfileData?.data?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=334155&color=fff`;

    const showToast = (message, type = "success") => {
        toast[type](message);
    };

    const handleLogoutConfirm = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            dispatch(logout());
            showToast("You have successfully logged out.", "success");
            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (error) {
            console.error("Failed to log out", error);
            showToast("Failed to log out. Please try again.", "error");
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setIsProfileOpen(false);
                if (!isLoggingOut) setShowLogoutConfirm(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isLoggingOut]);

    useEffect(() => {
        if (!isSearchOpen) return;
        const handleEscape = (e) => {
            if (e.key === "Escape") setIsSearchOpen(false);
        };
        const handleClick = (e) => {
            if (e.target.classList && e.target.classList.contains("search-modal-overlay")) {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        window.addEventListener("mousedown", handleClick);
        return () => {
            window.removeEventListener("keydown", handleEscape);
            window.removeEventListener("mousedown", handleClick);
        };
    }, [isSearchOpen]);

    // Only reset search state when modal closes
    useEffect(() => {
        if (!isSearchOpen) {
            setSearchQuery("");
            setSearchResults([]);
            setHighlightedIndex(0);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        if (!isSearchOpen || !searchQuery) {
            setSearchResults([]);
            setHighlightedIndex(0);
            return;
        }
        // Substring matches
        let results = mapData.filter((place) =>
            place.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        // If no substring matches, show the best fuzzy match (if any)
        if (results.length === 0 && mapData.length > 0) {
            let bestIdx = 0;
            let bestScore = 0;
            mapData.forEach((place, idx) => {
                const score = stringSimilarity(searchQuery, place.name);
                if (score > bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            });
            if (bestScore > 0.5) {
                results = [mapData[bestIdx]];
            }
        }
        setSearchResults(results);
        setHighlightedIndex(0);
    }, [searchQuery, isSearchOpen, mapData]);

    useEffect(() => {
        if (isSearchOpen && resultRefs.current[highlightedIndex]) {
            resultRefs.current[highlightedIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [highlightedIndex, isSearchOpen, searchResults]);

    if (hideMenu) return null;

    return (
        <>
            <div className="absolute top-10 right-10 z-1000 flex items-center gap-4 pointer-events-auto">
                {/* Magnify / Search Button */}
                <button
                    className="w-12 h-12 flex justify-center items-center bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur rounded-full border border-slate-700 shadow-xl text-slate-300 hover:text-white transition-all"
                    onClick={() => setIsSearchOpen(true)}
                    title="Search for a place"
                >
                    <FaSearch size={20} />
                </button>

                {/* Search Modal */}
                {isSearchOpen && (
                    <div className="fixed inset-0 z-5000 bg-black/50 flex justify-center pt-20 search-modal-overlay">
                        <div className="bg-slate-800 w-full max-w-md rounded-2xl h-fit border border-slate-700 shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                                <FaSearch className="text-slate-400" />
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            if (searchResults.length > 0) {
                                                onSelectPlace(searchResults[highlightedIndex]);
                                                setIsSearchOpen(false);
                                            } else {
                                                toast.error(`${mapMode === "province" ? "Province" : "Municipality"} not found`);
                                                setIsSearchOpen(false);
                                            }
                                        } else if (e.key === "ArrowDown") {
                                            setHighlightedIndex(i => Math.min(i + 1, searchResults.length - 1));
                                        } else if (e.key === "ArrowUp") {
                                            setHighlightedIndex(i => Math.max(i - 1, 0));
                                        }
                                    }}
                                    placeholder={`Search for a ${mapMode === "province" ? "province" : "municipality"}...`}
                                    className="bg-transparent text-white outline-none w-full"
                                />
                                <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 text-sm">Cancel</button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {searchQuery && searchResults.length === 0 && (
                                    <div className="p-4 text-slate-400 text-center text-sm">No results found.</div>
                                )}
                                {searchResults.map((place, idx) => (
                                    <button
                                        key={place.id}
                                        ref={el => resultRefs.current[idx] = el}
                                        onClick={() => {
                                            onSelectPlace(place);
                                            setIsSearchOpen(false);
                                        }}
                                        className={`w-full text-left px-6 py-3 hover:bg-slate-700/80 text-slate-200 transition-colors ${idx === highlightedIndex ? "bg-slate-700/80" : ""}`}
                                        style={{ fontWeight: idx === highlightedIndex ? "bold" : "normal" }}
                                    >
                                        <span className="block font-semibold">{place.name}</span>
                                        <span className="block text-xs text-slate-400">{place.province_name || place.province || "Unknown Province"}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile OR Sign In Button */}
                {isLoggedIn ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            title={userName}
                            className="w-12 h-12 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur rounded-full border border-slate-700 shadow-xl overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
                        >
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </button>

                        {/* Dropdown Modal overlay */}
                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col z-[1001]">
                                <div className="p-4 border-b border-slate-700 flex items-center gap-3 bg-slate-800">
                                    <img
                                        src={avatarSrc}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex flex-col overflow-hidden text-left">
                                        <span className="text-white font-semibold truncate block w-full">
                                            {userName}
                                        </span>
                                        <span className="text-slate-400 text-xs truncate block w-full">
                                            {userEmail}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="p-4 w-full text-left text-red-400 hover:bg-slate-700/80 hover:text-red-300 transition-colors flex items-center gap-2 font-semibold"
                                >
                                    <FaSignOutAlt />
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Guest View: Sign In Button instead of Avatar */
                    <button
                        onClick={() => navigate("/login")}
                        className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full font-bold shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all flex items-center gap-2"
                    >
                        <FaSignInAlt />
                        Sign In
                    </button>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100 opacity-100">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Confirm Logout
                        </h3>
                        <p className="text-slate-300 mb-6">
                            Are you sure you want to completely log out of your
                            account?
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={isLoggingOut}
                                className="px-4 py-2 rounded-lg font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                disabled={isLoggingOut}
                                className="px-5 py-2 rounded-lg font-semibold bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Logging out...
                                    </>
                                ) : (
                                    "Yes, Log out"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Loading Cursor Overlay */}
            {isLoggingOut && (
                <div className="fixed inset-0 z-[3000] cursor-wait" />
            )}
        </>
    );
};

export default TopRightMenu;
