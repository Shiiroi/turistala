import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "../../auth/hooks/useAuthSession";
import { DEFAULT_MAP_ACCENT } from "../../travel/hooks/useMockHeatmapData";
import { fetchProfile, updateProfile, type UserProfile } from "../services/profileApi";

const DEMO_MAP_COLOR_KEY = "turistala_map_color";

function loadDemoMapColor(): string {
    try {
        return window.localStorage.getItem(DEMO_MAP_COLOR_KEY) ?? DEFAULT_MAP_ACCENT;
    } catch {
        return DEFAULT_MAP_ACCENT;
    }
}

function saveDemoMapColor(color: string): void {
    try {
        window.localStorage.setItem(DEMO_MAP_COLOR_KEY, color);
    } catch {
        // ignore quota / private mode
    }
}

export function useMapAccentColor() {
    const { data: session } = useAuthSession();
    const userId = session?.user.id;
    const queryClient = useQueryClient();
    const saveTimerRef = useRef<number | null>(null);

    const { data: profile } = useQuery({
        queryKey: ["profile", userId],
        queryFn: () => fetchProfile(userId!),
        enabled: Boolean(userId),
    });

    const userKey = userId ?? "demo";
    const [colorOverride, setColorOverride] = useState<{ userKey: string; color: string } | null>(
        null,
    );

    const profileBaseline = userId ? (profile?.map_color ?? DEFAULT_MAP_ACCENT) : loadDemoMapColor();
    const mapAccentColor =
        colorOverride?.userKey === userKey ? colorOverride.color : profileBaseline;

    const onMapAccentColorChange = useCallback(
        (color: string) => {
            setColorOverride({ userKey, color });

            if (userId) {
                if (saveTimerRef.current != null) {
                    window.clearTimeout(saveTimerRef.current);
                }
                saveTimerRef.current = window.setTimeout(async () => {
                    try {
                        const updated = await updateProfile(userId, { map_color: color });
                        queryClient.setQueryData<UserProfile | null>(
                            ["profile", userId],
                            (old) => (old ? { ...old, map_color: updated.map_color } : updated),
                        );
                    } catch {
                        // Color stays in local state; will retry on next change
                    }
                }, 400);
                return;
            }

            saveDemoMapColor(color);
        },
        [userId, userKey, queryClient],
    );

    useEffect(() => {
        return () => {
            if (saveTimerRef.current != null) {
                window.clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    return { mapAccentColor, onMapAccentColorChange };
}
