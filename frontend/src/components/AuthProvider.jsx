import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logout } from "../slices/authSlice";
import { supabase } from "../supabaseClient";

export default function AuthProvider({ children }) {
    const dispatch = useDispatch();
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            if (session) {
                dispatch(
                    setCredentials({
                        user: session.user,
                        token: session.access_token,
                    }),
                );
            } else {
                dispatch(logout());
            }
            setAuthReady(true);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                dispatch(
                    setCredentials({
                        user: session.user,
                        token: session.access_token,
                    }),
                );
            } else {
                dispatch(logout());
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [dispatch]);

    if (!authReady) return null; // or loader
    return <>{children}</>;
}
