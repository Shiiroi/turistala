// PanelEmptyState.tsx — Placeholder when no division is selected.
// Prompts the user to click a region, province, or municipality on the map to begin exploring and journaling.

export function PanelEmptyState() {
    return (
        <div className="px-8 py-12 text-center">
            <h2 className="mb-3 font-display text-2xl text-primary">Your Philippine Journal</h2>
            <p className="mx-auto max-w-[320px] text-[15px] leading-relaxed text-muted">
                Explore the Philippines — click a region, province, or municipality to begin your
                journal.
            </p>
        </div>
    );
}
