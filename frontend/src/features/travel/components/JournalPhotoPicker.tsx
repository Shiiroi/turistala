// JournalPhotoPicker.tsx — Photo attachment control for journal forms.

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";
import {
    formatStorageMb,
    isStorageQuotaEnabled,
    JOURNAL_STORAGE_QUOTA_BYTES,
    STORAGE_WARNING_RATIO,
} from "../../../config/storageLimits";

export interface LocalPhoto {
    id?: string;
    file?: File;
    preview_url: string;
}

interface JournalPhotoPickerProps {
    photos: LocalPhoto[];
    onChange: (photos: LocalPhoto[]) => void;
    disabled?: boolean;
    hint?: string;
    storageBytesUsed?: number;
}

const DEMO_PHOTO_HINT =
    "Photos are available with a free account. Demo journals are text-only.";

export function JournalPhotoPicker({
    photos,
    onChange,
    disabled = false,
    hint,
    storageBytesUsed = 0,
}: JournalPhotoPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [quotaError, setQuotaError] = useState<string | null>(null);

    const quotaEnabled = isStorageQuotaEnabled();
    const atQuota = quotaEnabled && storageBytesUsed >= JOURNAL_STORAGE_QUOTA_BYTES;
    const nearQuota =
        quotaEnabled &&
        storageBytesUsed >= JOURNAL_STORAGE_QUOTA_BYTES * STORAGE_WARNING_RATIO;
    const photosDisabled = disabled || atQuota;

    function handleFilesSelected(files: FileList | null) {
        if (!files?.length || photosDisabled) return;
        setQuotaError(null);

        const pendingSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
        if (
            quotaEnabled &&
            storageBytesUsed + pendingSize > JOURNAL_STORAGE_QUOTA_BYTES
        ) {
            setQuotaError(
                "Storage quota exceeded. Delete old journal photos to free space.",
            );
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        const added = Array.from(files).map((file) => ({
            file,
            preview_url: URL.createObjectURL(file),
        }));
        onChange([...photos, ...added]);
        if (inputRef.current) inputRef.current.value = "";
    }

    function removePhoto(index: number) {
        const removed = photos[index];
        if (removed?.file) URL.revokeObjectURL(removed.preview_url);
        onChange(photos.filter((_, i) => i !== index));
        setQuotaError(null);
    }

    const usageHint = disabled ? (hint ?? DEMO_PHOTO_HINT) : null;

    return (
        <div className="mt-3">
            <Label className="mb-2">Photos</Label>

            {quotaEnabled && !disabled && (
                <StorageUsageBar bytesUsed={storageBytesUsed} />
            )}

            {nearQuota && !atQuota && !disabled && (
                <p className="mb-2 text-xs text-amber-800">
                    Storage almost full — delete old journal photos or upgrade later.
                </p>
            )}

            {usageHint && (
                <p className="mb-2 text-xs text-muted">{usageHint}</p>
            )}

            {quotaError && (
                <p className="mb-2 text-xs text-red-700">{quotaError}</p>
            )}

            {photos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                        <div
                            key={photo.id ?? photo.preview_url}
                            className="relative size-[72px] overflow-hidden rounded-lg border border-border"
                        >
                            <img src={photo.preview_url} alt="" className="size-full object-cover" />
                            {!photosDisabled && (
                                <button
                                    type="button"
                                    className={cn(
                                        "absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full",
                                        "border-none bg-[rgba(44,36,22,0.75)] p-0 text-white",
                                    )}
                                    onClick={() => removePhoto(index)}
                                    aria-label="Remove photo"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!photosDisabled && (
                <>
                    <button
                        type="button"
                        className={cn(
                            "flex size-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg",
                            "border border-dashed border-border bg-parchment font-mono text-[11px] text-muted",
                            "transition-[border-color,color] duration-150 hover:border-accent hover:text-accent",
                        )}
                        onClick={() => inputRef.current?.click()}
                    >
                        <ImagePlus size={18} />
                        <span>Add</span>
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => handleFilesSelected(e.target.files)}
                    />
                </>
            )}
        </div>
    );
}

function StorageUsageBar({ bytesUsed }: { bytesUsed: number }) {
    const quota = JOURNAL_STORAGE_QUOTA_BYTES;
    const ratio = Math.min(1, bytesUsed / quota);

    return (
        <div className="mb-2">
            <div className="mb-1 flex justify-between font-mono text-[11px] text-muted">
                <span>Journal storage</span>
                <span>
                    {formatStorageMb(bytesUsed)} / {formatStorageMb(quota)} MB
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border-light">
                <div
                    className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        ratio >= STORAGE_WARNING_RATIO ? "bg-amber-600" : "bg-accent",
                    )}
                    style={{ width: `${ratio * 100}%` }}
                />
            </div>
        </div>
    );
}
