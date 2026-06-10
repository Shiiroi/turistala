export const JOURNAL_STORAGE_QUOTA_BYTES =
    Number(import.meta.env.VITE_JOURNAL_STORAGE_QUOTA_MB ?? 10) * 1024 * 1024;

export const STORAGE_WARNING_RATIO = 0.75;

export const MAX_IMAGE_WIDTH = 1200;

export const WEBP_QUALITY = 0.85;

export function formatStorageMb(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(1);
}

export function isStorageQuotaEnabled(): boolean {
    return JOURNAL_STORAGE_QUOTA_BYTES > 0;
}
