// MapExportPreviewModal.tsx — Preview and save dialog for scoped PNG map exports.

import { Download } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { downloadDataUrlPng } from "../utils/captureMapScreenshot";

interface MapExportPreviewModalProps {
    isOpen: boolean;
    imageUrl: string | null;
    caption?: string;
    filename: string;
    onClose: () => void;
    onSaved?: () => void;
}

export function MapExportPreviewModal({
    isOpen,
    imageUrl,
    caption,
    filename,
    onClose,
    onSaved,
}: MapExportPreviewModalProps) {
    function handleSave() {
        if (!imageUrl) return;
        downloadDataUrlPng(imageUrl, filename);
        onSaved?.();
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export preview" size="lg">
            <div className="space-y-4">
                {caption && <p className="font-mono text-xs text-muted">{caption}</p>}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Map export preview"
                        className="max-h-[60vh] w-full rounded-lg border border-border-light object-contain"
                    />
                ) : null}
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!imageUrl}>
                        <Download size={14} className="mr-1.5" />
                        Save PNG
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
