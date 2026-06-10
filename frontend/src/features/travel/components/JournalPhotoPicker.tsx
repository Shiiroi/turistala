import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

export interface LocalPhoto {
    id?: string;
    file?: File;
    preview_url: string;
}

interface JournalPhotoPickerProps {
    photos: LocalPhoto[];
    onChange: (photos: LocalPhoto[]) => void;
}

export function JournalPhotoPicker({ photos, onChange }: JournalPhotoPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFilesSelected(files: FileList | null) {
        if (!files?.length) return;
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
    }

    return (
        <div className="journal-photo-picker">
            <div className="journal-photo-picker__label">Photos</div>
            <div className="journal-photo-picker__grid">
                {photos.map((photo, index) => (
                    <div key={photo.id ?? photo.preview_url} className="journal-photo-picker__thumb">
                        <img src={photo.preview_url} alt="" />
                        <button
                            type="button"
                            className="journal-photo-picker__remove"
                            onClick={() => removePhoto(index)}
                            aria-label="Remove photo"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="journal-photo-picker__add"
                    onClick={() => inputRef.current?.click()}
                >
                    <ImagePlus size={18} />
                    <span>Add</span>
                </button>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => handleFilesSelected(e.target.files)}
            />
        </div>
    );
}

export function localPhotosToStorePhotos(photos: LocalPhoto[]): { preview_url: string }[] {
    return photos.map((p) => ({ preview_url: p.preview_url }));
}
