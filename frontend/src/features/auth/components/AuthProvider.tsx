import { useAuthSession } from "../hooks/useAuthSession";

/** Mounts the Supabase auth listener once for the whole app. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthSession();
    return children;
}
