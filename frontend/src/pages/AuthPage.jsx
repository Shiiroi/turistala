import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa"; // Importing an icon for the guest button

const AuthPage = () => {
    const navigate = useNavigate();
    const token = useSelector((state) => state.auth.token);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (token) {
            navigate("/", { replace: true });
        }
    }, [token, navigate]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // redirect is handled by useEffect when token is set
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { username } },
                });
                if (error) throw error;

                if (data.session) {
                    // email confirmation disabled
                    navigate("/", { replace: true });
                } else {
                    setMessage("Check your email for the confirmation link!");
                }
            }
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h2>

                {message && (
                    <div className="mb-4 p-3 bg-teal-500/20 text-teal-400 rounded-lg text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Display Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                            required={!isLogin}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold p-3 rounded-lg transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:opacity-50"
                    >
                        {loading
                            ? "Processing..."
                            : isLogin
                              ? "Sign In"
                              : "Sign Up"}
                    </button>
                </form>

                {/* Continue as Guest Button */}
                <div className="mt-6 flex flex-col gap-4">
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">
                            OR
                        </span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold p-3 rounded-lg border border-slate-600 transition-all hover:text-white"
                    >
                        <FaUserCircle size={20} />
                        Continue as Guest
                    </button>
                </div>

                <p className="mt-6 text-slate-400 text-center text-sm">
                    {isLogin
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-teal-400 hover:underline font-bold transition-all"
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
