// Supabase client for user profile records.
// Reads and updates username, avatar URL, and map accent color on the users table for authenticated travelers.

import { supabase } from "../../../config/supabase";

export interface UserProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    map_color: string;
}

 /**
  * Service API wrapper function to fetch profile.
  * @param userId - Parameter representing userId.
  * @returns Value or promise returned by fetchProfile.
 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, map_color")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return data as UserProfile | null;
}

export async function updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, "username" | "avatar_url" | "map_color">>,
): Promise<UserProfile> {
    const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select("id, username, avatar_url, map_color")
        .single();
    if (error) throw error;
    return data as UserProfile;
}
