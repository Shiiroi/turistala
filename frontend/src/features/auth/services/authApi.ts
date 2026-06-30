// Thin Supabase client wrappers for authentication.

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../../config/supabase";

 /**
  * Performs operations for signUp in authApi.ts.
  * @param email - Parameter representing email.
  * @param password - Parameter representing password.
  * @param username - Parameter representing username.
  * @returns Value or promise returned by signUp.
 */
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

 /**
  * Performs operations for signIn in authApi.ts.
  * @param email - Parameter representing email.
  * @param password - Parameter representing password.
  * @returns Value or promise returned by signIn.
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

 /**
  * Performs operations for signOut in authApi.ts.
  * @returns Value or promise returned by signOut.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

 /**
  * Performs operations for resetPasswordForEmail in authApi.ts.
  * @param email - Parameter representing email.
  * @returns Value or promise returned by resetPasswordForEmail.
 */
export async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}

 /**
  * Service API wrapper function to update password.
  * @param newPassword - Parameter representing newPassword.
  * @returns Value or promise returned by updatePassword.
 */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

 /**
  * Performs operations for getSession in authApi.ts.
  * @returns Value or promise returned by getSession.
 */
export async function getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

 /**
  * Performs operations for onAuthStateChange in authApi.ts.
  * @param callback - Parameter representing callback.
  * @param session - Parameter representing session.
  * @returns Value or promise returned by onAuthStateChange.
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
}
