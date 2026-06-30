// Tailwind CSS class name merger.
// Combines clsx conditional class logic with tailwind-merge deduplication for conflict-safe className

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

 /**
  * Performs operations for cn in cn.ts.
  * @returns Value or promise returned by cn.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
