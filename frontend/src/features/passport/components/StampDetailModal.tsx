// StampDetailModal.tsx — Modal wrapper for stamp detail content.

import { Modal } from "../../../components/ui/Modal";
import type { Geometry } from "geojson";
import type { DivisionProgress } from "../types";
import type { ProvincialProgressBy, RegionalProgressBy } from "../utils/computePassportStats";
import { StampDetailPanel } from "./StampDetailPanel";

const STACKED_Z = 10001;

interface StampDetailModalProps {
    isOpen: boolean;
    kind: "region" | "province";
    id: number;
    name: string;
    subtitle?: string;
    fraction: number;
    visited: number;
    total: number;
    geometry?: Geometry;
    childMetric: RegionalProgressBy | ProvincialProgressBy;
    children: DivisionProgress[];
    onClose: () => void;
    onViewOnMap: () => void;
    onDownloadStamp: () => void;
    onChildClick?: (row: DivisionProgress) => void;
    downloading?: boolean;
}

export function StampDetailModal({
    isOpen,
    onClose,
    ...panelProps
}: StampDetailModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={panelProps.name}
            subtitle={panelProps.subtitle}
            size="md"
            zIndex={STACKED_Z}
        >
            <StampDetailPanel {...panelProps} />
        </Modal>
    );
}
