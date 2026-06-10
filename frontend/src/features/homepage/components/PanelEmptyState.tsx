export function PanelEmptyState() {
    return (
        <div
            style={{
                padding: "48px 32px",
                textAlign: "center",
            }}
        >
            <h2
                style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    marginBottom: 12,
                }}
            >
                Your Philippine Journal
            </h2>
            <p
                style={{
                    color: "var(--text-muted)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    maxWidth: 320,
                    margin: "0 auto",
                }}
            >
                Explore the Philippines — click a region, province, or municipality to begin
                your journal.
            </p>
        </div>
    );
}
