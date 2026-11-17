import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import { Helmet } from "react-helmet";
import useAxiosPublic from "./useAxiosPublic";

const inputCls =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "block mb-1.5 text-xs font-medium text-slate-600";

const Login = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const { user, loading, signIn, resetPassword } = useAuth();
    const location = useLocation();
    const axiosPublic = useAxiosPublic();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (user) {
            navigate("/", { replace: true });
            return;
        }
        const token = location.state?.gateToken;
        if (!token) {
            navigate("/", { replace: true });
            return;
        }
        axiosPublic.post("/gate/check", { token })
            .then(() => setAllowed(true))
            .catch(() => navigate("/", { replace: true }));

        // login page theke back dile home a jabe
        const handlePop = () => navigate("/", { replace: true });
        window.addEventListener("popstate", handlePop);
        return () => window.removeEventListener("popstate", handlePop);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user]);

    const handleLogin = (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        signIn(email, password)
            .then(() => {
                setAllowed(true);
                if (rememberMe) {
                    localStorage.setItem("rememberedEmail", email);
                } else {
                    localStorage.removeItem("rememberedEmail");
                }

                form.reset();
                toast.success("Welcome back! You've logged in successfully.");
                const redirectPath = location.state?.from?.pathname || "/";
                setTimeout(() => navigate(redirectPath), 2000);
            })
            .catch(() => {
                toast.error("Login Failed! Please check your credentials.");
            });
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        if (!resetEmail) {
            toast.error("Please enter a valid email address.");
            return;
        }
        resetPassword(resetEmail)
            .then(() => {
                toast.success("If the email exists, a reset link has been sent.");
                setResetEmail("");
                setShowForgotModal(false);
            })
            .catch((error) => {
                console.error(error);
                toast.error("Failed to send reset email. Please try again.");
            });
    };

    if (loading || user || !allowed) return null;

    return (
        <div className="min-h-[calc(100dvh-61px)] flex items-center justify-center p-3 sm:p-5">
            <Helmet>
                <title>Login - Bashay Bazar</title>
            </Helmet>

            <div className="w-full max-w-md">
                <form onSubmit={handleLogin}>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Login</h1>
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label htmlFor="login-email" className={labelCls}>Email</label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                className={inputCls}
                                placeholder="Enter your email"
                                defaultValue={localStorage.getItem("rememberedEmail") || ""}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="login-password" className={labelCls}>Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    name="password"
                                    autoComplete="new-password"
                                    type={showPassword ? "text" : "password"}
                                    className={`${inputCls} pr-11`}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-0 top-0 w-11 h-full flex items-center justify-center bg-transparent border-0 p-0 text-lg text-slate-400 hover:text-brand-600 transition"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6">
                            <label className="flex items-center gap-2 min-h-[40px] text-sm text-slate-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    className="accent-brand-600 w-4 h-4"
                                />
                                Remember Me
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="min-h-[40px] bg-transparent border-0 p-0 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline transition"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-3 shadow-sm"
                        >
                            Login
                        </button>

                        <p className="text-center text-sm text-slate-600 mt-5">
                            Don't have an account?
                            <Link
                                to="/register"
                                state={{ gateToken: location.state?.gateToken }}
                                className="text-brand-600 font-semibold hover:underline ml-1"
                            >
                                Register
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                        onClick={() => setShowForgotModal(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-slate-800">Reset Password</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    aria-label="Close"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border-0 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleResetPassword}>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    className={`${inputCls} mb-4`}
                                    placeholder="Enter your registered email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-3 shadow-sm"
                                >
                                    Send Reset Link
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;