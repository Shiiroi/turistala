// Profile avatar and username editing form.

import { useRef } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";
import { getInitials } from "../utils/getInitials";

interface AvatarEditorProps {
    username: string;
    sourceUrl: string | null;
    zoom: number;
    onUsernameChange: (username: string) => void;
    onSourceUrlChange: (url: string | null) => void;
    onZoomChange: (zoom: number) => void;
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
        <div className="flex flex-col gap-4">
            <Input
                label="Username"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Username"
            />

            <div className="flex items-start gap-4">
                <div
                    className={cn(
                        "flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden",
                        "rounded-full border-2 border-border bg-border-light",
                        "font-display text-[22px] font-semibold text-muted",
                    )}
                >
                    {sourceUrl ? (
                        <img
                            src={sourceUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{ transform: `scale(${zoom})` }}
                        />
                    ) : (
                        initials
                    )}
                </div>
                <div className="flex-1">
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
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => fileRef.current?.click()}>
                            Choose image
                        </Button>
                        {sourceUrl && (
                            <Button size="sm" variant="secondary" onClick={handleRemove}>
                                Remove image
                            </Button>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                        Selected image uploads only when you press Save.
                    </p>
                </div>
            </div>

            {sourceUrl && (
                <>
                    <div className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] border border-border bg-primary">
                        <img
                            src={sourceUrl}
                            alt=""
                            className="max-w-none max-h-full origin-center"
                            style={{ transform: `scale(${zoom})` }}
                        />
                        <div
                            className={cn(
                                "pointer-events-none absolute inset-0 m-auto h-[140px] w-[140px]",
                                "rounded-full border-2 border-dashed border-white/50",
                                "shadow-[inset_0_0_0_9999px_rgba(44,36,22,0.55)]",
                            )}
                            aria-hidden
                        />
                    </div>
                    <div>
                        <Label className="mb-1 block">Zoom</Label>
                        <input
                            type="range"
                            min={1}
                            max={2.5}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
