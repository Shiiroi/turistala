import type { LocalPhoto } from "../components/JournalPhotoPicker";

export interface JournalPhotoInput {
    id?: string;
    preview_url: string;
    file?: File;
}

export function localPhotosToJournalInput(photos: LocalPhoto[]): JournalPhotoInput[] {
    return photos.map((p) => ({
        id: p.id,
        preview_url: p.preview_url,
        file: p.file,
    }));
}

// deprecated: use localPhotosToJournalInput for authenticated uploads
export function localPhotosToStorePhotos(photos: LocalPhoto[]): { preview_url: string }[] {
    return photos.map((p) => ({ preview_url: p.preview_url }));
}
