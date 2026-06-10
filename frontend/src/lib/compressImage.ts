import { MAX_IMAGE_WIDTH, WEBP_QUALITY } from "../config/storageLimits";

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
