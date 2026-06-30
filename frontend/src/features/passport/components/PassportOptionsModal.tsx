// Settings modal for passport sections.

import { Modal } from "../../../components/ui/Modal";
import { PillTabs } from "../../../components/ui/PillTabs";
import type { PassportProgressLevel } from "../types";
import type { ProvincialProgressBy, RegionalProgressBy } from "../utils/computePassportStats";
import { ProgressTagPicker } from "./ProgressTagPicker";

const STACKED_Z = 10001;

export type OptionsPanel = "passport" | "regional" | "provincial";

type ProvinceStampFilter = "all" | "started";

interface PassportOptionsModalProps {
    panel: OptionsPanel | null;
    onClose: () => void;
    passportProgressLevels: PassportProgressLevel[];
    onPassportProgressChange: (levels: PassportProgressLevel[]) => void;
    passportIncludesProvinces: boolean;
    includeMM: boolean;
    includeSGA: boolean;
    onIncludeMMChange: (v: boolean) => void;
    onIncludeSGAChange: (v: boolean) => void;
    regionalProgressBy: RegionalProgressBy;
    onRegionalProgressByChange: (v: RegionalProgressBy) => void;
    regionalProgressOptions: { value: RegionalProgressBy; label: string }[];
    provincialProgressBy: ProvincialProgressBy;
    onProvincialProgressByChange: (v: ProvincialProgressBy) => void;
    provincialProgressOptions: { value: ProvincialProgressBy; label: string }[];
    provinceStampFilter: ProvinceStampFilter;
    onProvinceStampFilterChange: (v: ProvinceStampFilter) => void;
}

const PANEL_TITLES: Record<OptionsPanel, string> = {
    passport: "Passport options",
    regional: "Regional stamp options",
    provincial: "Provincial stamp options",
};

export function PassportOptionsModal({
    panel,
    onClose,
    passportProgressLevels,
    onPassportProgressChange,
    passportIncludesProvinces,
    includeMM,
    includeSGA,
    onIncludeMMChange,
    onIncludeSGAChange,
    regionalProgressBy,
    onRegionalProgressByChange,
    regionalProgressOptions,
    provincialProgressBy,
    onProvincialProgressByChange,
    provincialProgressOptions,
    provinceStampFilter,
    onProvinceStampFilterChange,
}: PassportOptionsModalProps) {
    return (
        <Modal
            isOpen={panel != null}
            onClose={onClose}
            title={panel ? PANEL_TITLES[panel] : undefined}
            size="sm"
            zIndex={STACKED_Z}
        >
            {panel === "passport" && (
                <div className="space-y-4">
                    <ProgressTagPicker
                        selected={passportProgressLevels}
                        onChange={onPassportProgressChange}
                    />
                    {passportIncludesProvinces && (
                        <div className="flex flex-col gap-3 border-t border-border-light pt-4">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
                                <input
                                    type="checkbox"
                                    checked={includeMM}
                                    onChange={(e) => onIncludeMMChange(e.target.checked)}
                                    className="accent-accent"
                                />
                                Include Metro Manila
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
                                <input
                                    type="checkbox"
                                    checked={includeSGA}
                                    onChange={(e) => onIncludeSGAChange(e.target.checked)}
                                    className="accent-accent"
                                />
                                Include Special Geographic Area
                            </label>
                        </div>
                    )}
                </div>
            )}

            {panel === "regional" && (
                <div>
                    <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                        Progress by
                    </p>
                    <PillTabs
                        value={regionalProgressBy}
                        onChange={onRegionalProgressByChange}
                        options={regionalProgressOptions}
                    />
                </div>
            )}

            {panel === "provincial" && (
                <div className="space-y-4">
                    <div>
                        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                            Progress by
                        </p>
                        <PillTabs
                            value={provincialProgressBy}
                            onChange={onProvincialProgressByChange}
                            options={provincialProgressOptions}
                        />
                    </div>
                    <div className="flex flex-col gap-3 border-t border-border-light pt-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                checked={includeMM}
                                onChange={(e) => onIncludeMMChange(e.target.checked)}
                                className="accent-accent"
                            />
                            Include Metro Manila
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
                            <input
                                type="checkbox"
                                checked={includeSGA}
                                onChange={(e) => onIncludeSGAChange(e.target.checked)}
                                className="accent-accent"
                            />
                            Include Special Geographic Area
                        </label>
                    </div>
                    <div className="border-t border-border-light pt-4">
                        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                            Show
                        </p>
                        <PillTabs
                            value={provinceStampFilter}
                            onChange={onProvinceStampFilterChange}
                            options={[
                                { value: "all", label: "All" },
                                { value: "started", label: "Started only" },
                            ]}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
}
