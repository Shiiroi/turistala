// Journal photo storage quota and compression defaults.
// Centralizes environment-driven storage limits, warning thresholds, image resize bounds, and WebP

export const JOURNAL_STORAGE_QUOTA_BYTES =
    Number(import.meta.env.VITE_JOURNAL_STORAGE_QUOTA_MB ?? 10) * 1024 * 1024;

export const STORAGE_WARNING_RATIO = 0.75;

export const MAX_IMAGE_WIDTH = 1200;

export const WEBP_QUALITY = 0.85;

 /**
  * Converts a raw byte count value into a megabytes (MB) decimal string representation.
  * @param bytes - The raw storage size in bytes.
  * @returns A string representing the size in MB with one decimal place precision.
 */
export function formatStorageMb(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(1);
}

 /**
  * Evaluates whether a non-zero storage quota is enforced on the active instance.
  * @returns True if the journal storage byte limit exceeds zero.
 */
export function isStorageQuotaEnabled(): boolean {
    return JOURNAL_STORAGE_QUOTA_BYTES > 0;
}
