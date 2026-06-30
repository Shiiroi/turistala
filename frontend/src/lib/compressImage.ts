// Browser-side image resizing and WebP compression.

import { MAX_IMAGE_WIDTH, WEBP_QUALITY } from "../config/storageLimits";

 /**
  * Compresses an image file by scaling its dimensions and converting it to WebP format.
  * @param file - The source image file to be compressed.
  * @param maxWidth - The maximum width or height allowed for the scaled image. Defaults to MAX_IMAGE_WIDTH.
  * @param quality - The compression quality parameter for WebP format (between 0.0 and 1.0). Defaults to WEBP_QUALITY.
  * @returns A promise resolving to an object containing the compressed image as a WebP Blob and its size in bytes.
  * @throws Error if the canvas context cannot be initialized or the compression fails.
 */
export async function compressImage(
    file: File,
    maxWidth = MAX_IMAGE_WIDTH,
    quality = WEBP_QUALITY,
): Promise<{ blob: Blob; byteSize: number }> {
    const bitmap = await createImageBitmap(file);
    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const scale = longestEdge > maxWidth ? maxWidth / longestEdge : 1;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        bitmap.close();
        throw new Error("Canvas is not supported in this browser");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => {
                if (result) resolve(result);
                else reject(new Error("Failed to compress image"));
            },
            "image/webp",
            quality,
        );
    });

    return { blob, byteSize: blob.size };
}
