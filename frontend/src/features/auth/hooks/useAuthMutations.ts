// useAuthMutations.ts — React Query mutations for Supabase auth operations.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetPasswordForEmail, signIn, signOut, signUp, updatePassword } from "../services/authApi";

export function useSignIn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            signIn(email, password),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "session"], data.session);
        },
    });
}

export function useSignUp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            email,
            password,
            username,
        }: {
            email: string;
            password: string;
            username: string;
        }) => signUp(email, password, username),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "session"], data.session);
        },
    });
}

export function useSignOut() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: signOut,
        onSuccess: () => {
            queryClient.setQueryData(["auth", "session"], null);
            queryClient.invalidateQueries({ queryKey: ["travel"] });
        },
    });
}

export function useResetPasswordRequest() {
    return useMutation({
        mutationFn: (email: string) => resetPasswordForEmail(email),
    });
}

export function useUpdatePassword() {
    return useMutation({
        mutationFn: (newPassword: string) => updatePassword(newPassword),
    });
}
