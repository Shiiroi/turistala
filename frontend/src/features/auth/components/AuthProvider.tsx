import { useAuthSession } from "../hooks/useAuthSession";

// Single Supabase auth listener for the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthSession();
    return children;
}
