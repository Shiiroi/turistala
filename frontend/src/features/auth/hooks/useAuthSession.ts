// React Query hook for the current Supabase session.

import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, onAuthStateChange } from "../services/authApi";

 /**
  * React hook providing states and handlers for authsession.
  * @returns Value or promise returned by useAuthSession.
 */
export function useAuthSession() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const sub = onAuthStateChange((_event, session) => {
            queryClient.setQueryData(["auth", "session"], session);
        });
        return () => sub.unsubscribe();
    }, [queryClient]);

    return useQuery<Session | null>({
        queryKey: ["auth", "session"],
        queryFn: getSession,
        staleTime: Infinity,
    });
}

export { useSignIn, useSignUp, useSignOut, useResetPasswordRequest, useUpdatePassword } from "./useAuthMutations";
