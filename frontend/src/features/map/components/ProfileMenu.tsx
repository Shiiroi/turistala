// ProfileMenu.tsx — Avatar dropdown with profile, passport, auth, and demo import actions.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { cn } from "../../../lib/cn";
import { useToast } from "../../../hooks/useToast";
import { useAuthSession, useSignOut } from "../../auth/hooks/useAuthSession";
import { fetchProfile, updateProfile } from "../../profile/services/profileApi";
import {
    AvatarEditor,
} from "../../profile/components/AvatarEditor";
import { cropAvatarToDataUrl } from "../../profile/utils/cropAvatarToDataUrl";
import { getInitials } from "../../profile/utils/getInitials";
import { ImportDemoModal } from "../../auth/components/ImportDemoModal";
import { PassportModal } from "../../passport/components/PassportModal";
import {
    clearDemoMode,
    clearImportDismissed,
    getDemoDataForImport,
    hasDemoData,
} from "../../travel/demoStorage";
import type { Division, MapMode } from "../../homepage/types";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../types";
import type { TravelStore } from "../../travel/types";

interface ProfileMenuProps {
    travelStore: TravelStore;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    onViewOnMap: (division: Division, mapMode: MapMode) => void;
    onEditProfile?: () => void;
}

export function ProfileMenu({
    travelStore,
    regions,
    provinces,
    municityMeta,
    onViewOnMap,
    onEditProfile,
}: ProfileMenuProps) {
    const navigate = useNavigate();
    const { data: session } = useAuthSession();
    const signOut = useSignOut();
    const queryClient = useQueryClient();
    const { success: toastSuccess, error: toastError } = useToast();
    const userId = session?.user.id;

    const { data: profile } = useQuery({
        queryKey: ["profile", userId],
        queryFn: () => fetchProfile(userId!),
        enabled: Boolean(userId),
    });

    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [passportOpen, setPassportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const isDemo = !session;
    const username = isDemo ? "Guest" : (profile?.username ?? session?.user.email?.split("@")[0] ?? "traveler");
    const avatarUrl = isDemo ? null : (profile?.avatar_url ?? null);

    const [editUsername, setEditUsername] = useState("");
    const [editSourceUrl, setEditSourceUrl] = useState<string | null>(null);
    const [editZoom, setEditZoom] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const demoPassportId = "DEMO-LOCAL";

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function openPassport() {
        setOpen(false);
        setPassportOpen(true);
    }

    function openEdit() {
        if (isDemo) {
            navigate("/signup");
            return;
        }
        setOpen(false);
        setEditUsername(username);
        setEditSourceUrl(avatarUrl);
        setEditZoom(1);
        setEditOpen(true);
        onEditProfile?.();
    }

    async function handleSave() {
        if (!userId || isSaving) return;
        setIsSaving(true);
        try {
            let finalAvatar = avatarUrl;
            if (editSourceUrl) {
                finalAvatar = await cropAvatarToDataUrl(editSourceUrl, editZoom);
            } else {
                finalAvatar = null;
            }
            await updateProfile(userId, {
                username: editUsername.trim() || null,
                avatar_url: finalAvatar,
            });
            queryClient.invalidateQueries({ queryKey: ["profile", userId] });
            toastSuccess("Profile updated");
            setEditOpen(false);
        } catch {
            toastError("Could not save profile");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSignOut() {
        setOpen(false);
        await signOut.mutateAsync();
        clearDemoMode();
        navigate("/");
    }

    const initials = getInitials(username);
    const manualImportData = userId ? getDemoDataForImport() : null;
    const showManualImport = Boolean(userId && manualImportData && hasDemoData());

    function openManualImport() {
        clearImportDismissed();
        setOpen(false);
        setImportOpen(true);
    }

    return (
        <>
            <div ref={ref} className="relative">
                <button
                    type="button"
                    className={cn(
                        "flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border bg-accent p-0",
                        "font-display text-sm font-semibold text-white",
                    )}
                    onClick={() => setOpen(!open)}
                    aria-label="Profile menu"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                        initials.slice(0, 1)
                    )}
                </button>
                {open && (
                    <div
                        className={cn(
                            "absolute right-0 top-11 z-[1100] min-w-44 overflow-hidden rounded-lg border border-border bg-parchment shadow-[var(--shadow-lg)]",
                        )}
                    >
                        <div className="border-b border-border-light px-4 py-2.5 text-sm font-medium text-primary">
                            {username}
                        </div>
                        {isDemo ? (
                            <Link
                                to="/signup"
                                className={cn(menuItemClass, "text-accent no-underline")}
                                onClick={() => setOpen(false)}
                            >
                                Sign up to save
                            </Link>
                        ) : (
                            <button type="button" className={menuItemClass} onClick={openEdit}>
                                Edit Profile
                            </button>
                        )}
                        <button type="button" className={menuItemClass} onClick={openPassport}>
                            My Passport
                        </button>
                        {showManualImport && (
                            <button type="button" className={menuItemClass} onClick={openManualImport}>
                                Import demo from this device
                            </button>
                        )}
                        {isDemo ? (
                            <Link
                                to="/login"
                                className={cn(menuItemClass, "no-underline")}
                                onClick={() => setOpen(false)}
                            >
                                Sign in
                            </Link>
                        ) : (
                            <button type="button" className={menuItemClass} onClick={handleSignOut}>
                                Sign out
                            </button>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                title="Edit Profile"
                subtitle="Select an avatar image and crop it before saving."
                size="md"
            >
                <AvatarEditor
                    username={editUsername}
                    sourceUrl={editSourceUrl}
                    zoom={editZoom}
                    onUsernameChange={setEditUsername}
                    onSourceUrlChange={setEditSourceUrl}
                    onZoomChange={setEditZoom}
                />
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setEditOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} loading={isSaving} disabled={isSaving}>
                        Save
                    </Button>
                </div>
            </Modal>

            <PassportModal
                isOpen={passportOpen}
                onClose={() => setPassportOpen(false)}
                username={username}
                initials={initials}
                avatarUrl={avatarUrl}
                passportId={
                    userId
                        ? `PH-${userId.slice(0, 8).toUpperCase()}`
                        : demoPassportId
                }
                isDemo={isDemo}
                travelStore={travelStore}
                regions={regions}
                provinces={provinces}
                municityMeta={municityMeta}
                onViewOnMap={onViewOnMap}
            />

            {userId && manualImportData && (
                <ImportDemoModal
                    isOpen={importOpen}
                    userId={userId}
                    demoData={manualImportData}
                    onDone={() => setImportOpen(false)}
                />
            )}
        </>
    );
}

const menuItemClass = cn(
    "block w-full cursor-pointer border-none bg-transparent px-4 py-2.5 text-left font-body text-sm text-primary",
);
