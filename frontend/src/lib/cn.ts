// cn.ts — Tailwind CSS class name merger.
// Combines clsx conditional class logic with tailwind-merge deduplication for conflict-safe className

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
