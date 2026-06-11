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
