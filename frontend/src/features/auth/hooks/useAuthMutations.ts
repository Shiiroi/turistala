// React Query mutations for Supabase auth operations.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetPasswordForEmail, signIn, signOut, signUp, updatePassword } from "../services/authApi";

 /**
  * React hook providing states and handlers for signin.
  * @returns Value or promise returned by useSignIn.
 */
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

 /**
  * React hook providing states and handlers for signup.
  * @returns Value or promise returned by useSignUp.
 */
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

 /**
  * React hook providing states and handlers for signout.
  * @returns Value or promise returned by useSignOut.
 */
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

 /**
  * React hook providing states and handlers for resetpasswordrequest.
  * @returns Value or promise returned by useResetPasswordRequest.
 */
export function useResetPasswordRequest() {
    return useMutation({
        mutationFn: (email: string) => resetPasswordForEmail(email),
    });
}

 /**
  * React hook providing states and handlers for updatepassword.
  * @returns Value or promise returned by useUpdatePassword.
 */
export function useUpdatePassword() {
    return useMutation({
        mutationFn: (newPassword: string) => updatePassword(newPassword),
    });
}
