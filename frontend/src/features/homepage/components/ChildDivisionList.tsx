interface ChildItem {
    id: number;
    name: string;
    subtitle?: string;
}

interface ChildDivisionListProps {
    title: string;
    items: ChildItem[];
    onSelect: (id: number) => void;
}

export function ChildDivisionList({ title, items, onSelect }: ChildDivisionListProps) {
    if (items.length === 0) return null;

    return (
        <div style={{ marginBottom: 20 }}>
            <div className="label-mono" style={{ marginBottom: 8 }}>
                {title}
            </div>
            <div
                style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid var(--border-light)",
                    borderRadius: 8,
                }}
            >
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px 14px",
                            border: "none",
                            borderBottom: "1px solid var(--border-light)",
                            background: "transparent",
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                        {item.subtitle && (
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-muted)",
                                    fontFamily: "var(--font-mono)",
                                }}
                            >
                                {item.subtitle}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
