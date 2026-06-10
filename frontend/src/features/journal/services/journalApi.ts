import { supabase } from "../../../config/supabase";
import {
    isStorageQuotaEnabled,
    JOURNAL_STORAGE_QUOTA_BYTES,
} from "../../../config/storageLimits";
import { compressImage } from "../../../lib/compressImage";
import type { Journal, JournalPhoto } from "../../travel/types";

interface DbJournal {
    id: string;
    user_id: string;
    place_id: string;
    title: string | null;
    content: string | null;
    visit_date: string | null;
    created_at: string;
}

interface DbJournalPhoto {
    id: string;
    journal_id: string;
    storage_url: string;
    display_order: number;
    byte_size: number | null;
}

function toJournal(row: DbJournal, photos: JournalPhoto[]): Journal {
    return {
        id: row.id,
        place_id: row.place_id,
        title: row.title ?? "",
        content: row.content ?? "",
        visit_date: row.visit_date ?? "",
        photos,
        created_at: row.created_at,
    };
}

function storagePathFromUrl(url: string): string {
    const marker = "/journal-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) throw new Error("Invalid journal photo URL");
    return decodeURIComponent(url.slice(idx + marker.length));
}

async function assertJournalOwnership(userId: string, journalId: string): Promise<void> {
    const { data, error } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("id", journalId)
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Journal not found");
}

async function incrementStorageBytes(userId: string, delta: number): Promise<void> {
    const used = await fetchUserStorageUsage(userId);
    const { error } = await supabase
        .from("users")
        .update({ storage_bytes_used: Math.max(0, used + delta) })
        .eq("id", userId);
    if (error) throw error;
}

export async function fetchUserStorageUsage(userId: string): Promise<number> {
    const { data, error } = await supabase
        .from("users")
        .select("storage_bytes_used")
        .eq("id", userId)
        .single();
    if (error) throw error;
    return data?.storage_bytes_used ?? 0;
}

export async function fetchJournalEntries(userId: string): Promise<Journal[]> {
    const { data: entries, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("visit_date", { ascending: false });
    if (error) throw error;

    const rows = (entries ?? []) as DbJournal[];
    if (rows.length === 0) return [];

    const journalIds = rows.map((r) => r.id);
    const { data: photos, error: photoError } = await supabase
        .from("journal_photos")
        .select("*")
        .in("journal_id", journalIds)
        .order("display_order");
    if (photoError) throw photoError;

    const photosByJournal = new Map<string, JournalPhoto[]>();
    for (const p of (photos ?? []) as DbJournalPhoto[]) {
        const list = photosByJournal.get(p.journal_id) ?? [];
        list.push({
            id: p.id,
            preview_url: p.storage_url,
            display_order: p.display_order,
        });
        photosByJournal.set(p.journal_id, list);
    }

    return rows.map((r) => toJournal(r, photosByJournal.get(r.id) ?? []));
}

export async function createJournalEntry(
    userId: string,
    data: {
        place_id: string;
        title: string;
        content: string;
        visit_date: string;
    },
): Promise<Journal> {
    const { data: row, error } = await supabase
        .from("journal_entries")
        .insert({
            user_id: userId,
            place_id: data.place_id,
            title: data.title,
            content: data.content,
            visit_date: data.visit_date,
        })
        .select()
        .single();
    if (error) throw error;
    return toJournal(row as DbJournal, []);
}

export async function updateJournalEntry(
    userId: string,
    journalId: string,
    updates: Partial<Pick<Journal, "title" | "content" | "visit_date">>,
): Promise<void> {
    const { error } = await supabase
        .from("journal_entries")
        .update(updates)
        .eq("id", journalId)
        .eq("user_id", userId);
    if (error) throw error;
}

export async function uploadJournalPhoto(
    userId: string,
    journalId: string,
    file: File,
    displayOrder = 0,
): Promise<JournalPhoto> {
    await assertJournalOwnership(userId, journalId);

    const { blob, byteSize } = await compressImage(file);
    const used = await fetchUserStorageUsage(userId);

    if (
        isStorageQuotaEnabled() &&
        used + byteSize > JOURNAL_STORAGE_QUOTA_BYTES
    ) {
        throw new Error(
            "Storage quota exceeded. Delete old journal photos to free space.",
        );
    }

    const objectId = crypto.randomUUID();
    const path = `${userId}/${journalId}/${objectId}.webp`;

    const { error: uploadError } = await supabase.storage
        .from("journal-images")
        .upload(path, blob, { contentType: "image/webp", upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("journal-images").getPublicUrl(path);
    const storageUrl = urlData.publicUrl;

    const { data: photoRow, error: insertError } = await supabase
        .from("journal_photos")
        .insert({
            journal_id: journalId,
            storage_url: storageUrl,
            display_order: displayOrder,
            byte_size: byteSize,
        })
        .select()
        .single();

    if (insertError) {
        await supabase.storage.from("journal-images").remove([path]);
        throw insertError;
    }

    await incrementStorageBytes(userId, byteSize);

    return {
        id: (photoRow as DbJournalPhoto).id,
        preview_url: storageUrl,
        display_order: displayOrder,
    };
}

/** @deprecated Use uploadJournalPhoto */
export async function uploadJournalImage(
    file: File,
    userId: string,
    journalId: string,
    displayOrder = 0,
): Promise<JournalPhoto> {
    return uploadJournalPhoto(userId, journalId, file, displayOrder);
}

export async function deleteJournalPhoto(userId: string, photoId: string): Promise<void> {
    const { data: photo, error: fetchError } = await supabase
        .from("journal_photos")
        .select("id, storage_url, byte_size, journal_id")
        .eq("id", photoId)
        .single();
    if (fetchError) throw fetchError;
    if (!photo) throw new Error("Photo not found");

    await assertJournalOwnership(userId, photo.journal_id);

    const path = storagePathFromUrl(photo.storage_url);
    const { error: storageError } = await supabase.storage
        .from("journal-images")
        .remove([path]);
    if (storageError) throw storageError;

    const { error: deleteError } = await supabase
        .from("journal_photos")
        .delete()
        .eq("id", photoId);
    if (deleteError) throw deleteError;

    if (photo.byte_size) {
        await incrementStorageBytes(userId, -photo.byte_size);
    }
}

async function deleteJournalPhotosForEntry(userId: string, journalId: string): Promise<void> {
    const { data: photos, error } = await supabase
        .from("journal_photos")
        .select("id")
        .eq("journal_id", journalId);
    if (error) throw error;

    for (const photo of photos ?? []) {
        await deleteJournalPhoto(userId, photo.id);
    }
}

export async function deleteJournalEntry(userId: string, journalId: string): Promise<void> {
    await deleteJournalPhotosForEntry(userId, journalId);

    const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", journalId)
        .eq("user_id", userId);
    if (error) throw error;
}
