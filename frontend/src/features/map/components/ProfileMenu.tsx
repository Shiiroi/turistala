import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import {
    AvatarEditor,
    cropAvatarToDataUrl,
    getInitials,
} from "../../profile/components/AvatarEditor";

interface ProfileMenuProps {
    onEditProfile?: () => void;
}

export function ProfileMenu({ onEditProfile }: ProfileMenuProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const [username, setUsername] = useState("traveler");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [editSourceUrl, setEditSourceUrl] = useState<string | null>(null);
    const [editZoom, setEditZoom] = useState(1);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function openEdit() {
        setOpen(false);
        setEditSourceUrl(avatarUrl);
        setEditZoom(1);
        setEditOpen(true);
        onEditProfile?.();
    }

    async function handleSave() {
        let finalAvatar = avatarUrl;
        if (editSourceUrl) {
            finalAvatar = await cropAvatarToDataUrl(editSourceUrl, editZoom);
            setAvatarUrl(finalAvatar);
        } else {
            setAvatarUrl(null);
            finalAvatar = null;
        }
        console.log({
            action: "UPDATE_PROFILE",
            username,
            avatarUrl: finalAvatar,
        });
        setEditOpen(false);
    }

    const initials = getInitials(username);

    return (
        <>
            <div ref={ref} style={{ position: "relative" }}>
                <button
                    type="button"
                    className="profile-avatar-btn"
                    onClick={() => setOpen(!open)}
                    aria-label="Profile menu"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" />
                    ) : (
                        initials.slice(0, 1)
                    )}
                </button>
                {open && (
                    <div
                        style={{
                            position: "absolute",
                            top: 44,
                            right: 0,
                            minWidth: 160,
                            background: "var(--bg-parchment)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            boxShadow: "var(--shadow-lg)",
                            overflow: "hidden",
                            zIndex: 1100,
                        }}
                    >
                        <button type="button" style={menuItemStyle} onClick={openEdit}>
                            Edit Profile
                        </button>
                        <button
                            type="button"
                            style={menuItemStyle}
                            onClick={() => {
                                console.log({ action: "SIGN_OUT" });
                                setOpen(false);
                            }}
                        >
                            Sign Out
                        </button>
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
                    username={username}
                    sourceUrl={editSourceUrl}
                    zoom={editZoom}
                    onUsernameChange={setUsername}
                    onSourceUrlChange={setEditSourceUrl}
                    onZoomChange={setEditZoom}
                />
                <div className="profile-edit-footer">
                    <Button variant="secondary" onClick={() => setEditOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </Modal>
        </>
    );
}

const menuItemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    color: "var(--text-primary)",
};
