import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { TbPhoneCalling } from "react-icons/tb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleLogin from "../../Layout/Google/GoogleLogin";
import useAuth from "../../Layout/useAuth";
import { Helmet } from "react-helmet";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const { signIn, resetPassword } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        signIn(email, password)
            .then(() => {
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

    return (
        <div className="pt-12 pb-20 max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center relative px-4 md:px-0 gap-10 md:gap-0">
            <Helmet>
                <title>Login - Storial Peace</title>
            </Helmet>

            {/* Left Section */}
            <div className="w-full md:w-3/8 space-y-5 text-center md:text-left">
                <h2 className="text-4xl font-bold leading-12">
                    Our Best Reliable <span className="text-[#2acb35]">Gardening and Lawn</span> Services
                </h2>
                <Link to="/contact">
                    <button className="btn px-6 py-5 text-lg font-medium rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35] mx-auto md:mx-0 flex items-center justify-center gap-2">
                        <TbPhoneCalling className="text-xl" /> Contact Us
                    </button>
                </Link>
            </div>

            {/* Right Section (Login Form) */}
            <div className="w-full md:w-3/7">
                <form onSubmit={handleLogin}>
                    <div className="p-8 border-2 border-gray-300 rounded-lg shadow-lg relative bg-white">
                        <h2 className="text-3xl text-center font-extrabold mb-6 text-[#2acb35]">
                            Login Now
                        </h2>

                        {/* Email Field */}
                        <div className="mb-4">
                            <label className="block mb-2 font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter your email"
                                defaultValue={localStorage.getItem("rememberedEmail") || ""}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className="mb-2">
                            <label className="block mb-2 text-gray-700 font-medium">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your password"
                                    required
                                />
                                <span
                                    className="absolute text-xl right-4 top-3 cursor-pointer text-gray-600 hover:text-gray-900"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-3 gap-3 sm:gap-0">
                            <label className="flex items-center space-x-2 font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    className="accent-[#2acb35]"
                                />
                                <span>Remember Me</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-gray-700 font-medium underline"
                            >
                                Forgot Password
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn w-full py-2 text-lg font-semibold rounded-md text-white bg-gradient-to-r from-[#2acb35] via-green-500 to-[#2acb35] shadow-md"
                        >
                            Login
                        </button>

                        {/* Register Link */}
                        <p className="text-center text-lg font-medium mt-4 text-gray-700">
                            Don't have an account?
                            <Link to="/register" className="text-[#2acb35] hover:underline ml-1">
                                Register
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Google Login */}
                <div className="mt-4">
                    <GoogleLogin />
                </div>

                {/* Toast */}
                <ToastContainer />

                {/* Forgot Password Modal */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-30">
                        <div className="bg-white border border-gray-300 shadow-xl p-5 rounded-md w-full max-w-md relative mx-4">
                            <button
                                onClick={() => setShowForgotModal(false)}
                                className="absolute top-1 right-2 text-gray-600 hover:text-red-500 text-lg"
                            >
                                ✖
                            </button>
                            <h3 className="text-lg font-bold text-green-600 mb-3">Reset Your Password</h3>
                            <form onSubmit={handleResetPassword}>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                                    placeholder="Enter your registered email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md"
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
