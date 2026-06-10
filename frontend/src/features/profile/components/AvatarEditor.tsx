import { useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface AvatarEditorProps {
    username: string;
    sourceUrl: string | null;
    zoom: number;
    onUsernameChange: (username: string) => void;
    onSourceUrlChange: (url: string | null) => void;
    onZoomChange: (zoom: number) => void;
}

export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarEditor({
    username,
    sourceUrl,
    zoom,
    onUsernameChange,
    onSourceUrlChange,
    onZoomChange,
}: AvatarEditorProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const initials = getInitials(username || "Guest");

    function handleFile(file: File) {
        onSourceUrlChange(URL.createObjectURL(file));
        onZoomChange(1);
    }

    function handleRemove() {
        if (sourceUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(sourceUrl);
        }
        onSourceUrlChange(null);
        onZoomChange(1);
        if (fileRef.current) fileRef.current.value = "";
    }

    return (
        <div className="avatar-editor">
            <Input
                label="Username"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Username"
            />

            <div className="avatar-editor__row">
                <div className="avatar-editor__preview-wrap">
                    {sourceUrl ? (
                        <img src={sourceUrl} alt="" style={{ transform: `scale(${zoom})` }} />
                    ) : (
                        initials
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                    />
                    <div className="avatar-editor__actions">
                        <Button size="sm" onClick={() => fileRef.current?.click()}>
                            Choose image
                        </Button>
                        {sourceUrl && (
                            <Button size="sm" variant="secondary" onClick={handleRemove}>
                                Remove image
                            </Button>
                        )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                        Selected image uploads only when you press Save.
                    </p>
                </div>
            </div>

            {sourceUrl && (
                <>
                    <div className="avatar-editor__crop">
                        <img
                            src={sourceUrl}
                            alt=""
                            style={{ transform: `scale(${zoom})`, maxHeight: "100%" }}
                        />
                        <div className="avatar-editor__crop-mask" aria-hidden />
                    </div>
                    <div>
                        <div className="avatar-editor__zoom-label">Zoom</div>
                        <input
                            type="range"
                            min={1}
                            max={2.5}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export async function cropAvatarToDataUrl(sourceUrl: string, zoom: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const size = 128;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(sourceUrl);
                return;
            }
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const drawSize = size * zoom;
            const offset = (size - drawSize) / 2;
            ctx.drawImage(img, offset, offset, drawSize, drawSize);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = sourceUrl;
    });
}
