import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../../config/supabase";

export async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username },
            // Add `${origin}/map` to Supabase Auth → URL Configuration → Redirect URLs
            emailRedirectTo: `${window.location.origin}/map`,
        },
    });
    if (error) throw error;
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}

export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
}
