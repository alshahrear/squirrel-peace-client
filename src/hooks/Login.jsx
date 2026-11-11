import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuth from "../hooks/useAuth";
import { Helmet } from "react-helmet";
import useAxiosPublic from "./useAxiosPublic";

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
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
            <Helmet>
                <title>Login - Squirrel Peace</title>
            </Helmet>

            {/* Login Form */}
            <div className="w-full max-w-md">
                <form onSubmit={handleLogin}>
                    <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100">
                        {/* Top Accent Bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-[#2acb35] via-emerald-400 to-[#2acb35]"></div>

                        <div className="p-8 sm:p-10">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800">
                                    Login <span className="text-[#2acb35]">Now</span>
                                </h2>
                                <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#2acb35]"></div>
                            </div>

                            {/* Email Field */}
                            <div className="mb-5">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:bg-white focus:border-[#2acb35] focus:ring-4 focus:ring-green-100"
                                    placeholder="Enter your email"
                                    defaultValue={localStorage.getItem("rememberedEmail") || ""}
                                    required
                                />
                            </div>

                            {/* Password Field */}
                            <div className="mb-2">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        autoComplete="new-password"
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:bg-white focus:border-[#2acb35] focus:ring-4 focus:ring-green-100"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <span
                                        className="absolute text-xl right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-[#2acb35] transition"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>

                            {/* Remember Me + Forgot Password */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-4 gap-3 sm:gap-0">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                        className="accent-[#2acb35] w-4 h-4"
                                    />
                                    <span>Remember Me</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-sm text-gray-600 font-medium hover:text-[#2acb35] hover:underline transition"
                                >
                                    Forgot Password
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn w-full h-12 border-none text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-[#2acb35] via-green-500 to-[#2acb35] shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                            >
                                Login
                            </button>

                            {/* Register Link */}
                            <p className="text-center text-base font-medium mt-6 text-gray-600">
                                Don't have an account?
                                <Link
                                    to="/register"
                                    state={{ gateToken: location.state?.gateToken }}
                                    className="text-[#2acb35] font-semibold hover:underline ml-1"
                                >
                                    Register
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>

                {/* Google Login
                <div className="mt-4">
                    <GoogleLogin />
                </div> */}

                {/* Toast */}
                <ToastContainer />

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative mx-4 overflow-hidden">
                            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#2acb35] via-emerald-400 to-[#2acb35]"></div>
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-lg transition"
                            >
                                ✖
                            </button>
                            <h3 className="text-xl font-bold text-gray-800 mb-4 mt-2">Reset Your Password</h3>
                            <form onSubmit={handleResetPassword}>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:bg-white focus:border-[#2acb35] focus:ring-4 focus:ring-green-100"
                                    placeholder="Enter your registered email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-[#2acb35] hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition"
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