// ChildDivisionList.tsx — Scrollable list of selectable child divisions.

import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";

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
        <div className="mb-5">
            <Label className="mb-2">{title}</Label>
            <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border-light">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={cn(
                            "block w-full cursor-pointer border-none border-b border-border-light bg-transparent px-3.5 py-2.5 text-left font-body last:border-b-0",
                        )}
                    >
                        <div className="text-sm font-medium text-primary">{item.name}</div>
                        {item.subtitle && (
                            <div className="font-mono text-xs text-muted">{item.subtitle}</div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
