import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { TbPhoneCalling } from "react-icons/tb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleLogin from "../../Layout/Google/GoogleLogin";
import useAuth from "../../Layout/useAuth";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { signIn } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        signIn(email, password)
            .then((result) => {
                console.log(result.user);
                form.reset();
                toast.success("Welcome back! You've logged in successfully.", {
                    position: "top-right",
                    autoClose: 2000,
                });

                const redirectPath = location.state?.from?.pathname || "/";

                // Wait for toast to show before navigating
                setTimeout(() => {
                    navigate(redirectPath);
                }, 2100);
            })
            .catch((error) => {
                console.error(error.message);
                toast.error("Login Failed! Please correct your login details.", {
                    position: "top-right",
                    autoClose: 2000,
                });
            });
    };

    return (
        <div className="pt-12 pb-20 max-w-screen-xl mx-auto flex justify-between items-center relative">
            {/* Left Side Content */}
            <div className="w-3/8 space-y-5">
                <h2 className="text-4xl font-bold leading-12">
                    Our Best Reliable <span className="text-[#2acb35]">Gardening and Lawn</span> Services
                </h2>
                <Link to="/contact">
                    <button className="btn px-6 py-5 text-lg font-medium rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]">
                        <TbPhoneCalling className="text-xl" /> Contact Us
                    </button>
                </Link>
            </div>

            {/* Login Form */}
            <div className="w-3/7">
                <form onSubmit={handleLogin}>
                    <div className="p-8 border-2 border-gray-300 rounded-lg shadow-lg">
                        <h2 className="text-3xl text-center font-extrabold mb-6 text-[#2acb35]">
                            Login Now
                        </h2>

                        {/* Email Input */}
                        <div className="mb-4">
                            <label className="block mb-2 font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="mb-6">
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
                                    className="absolute text-xl right-4 top-3 cursor-pointer text-gray-600 hover:text-gray-900 transition"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
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
                            <Link to="/register" className="text-[#2acb35] text-lg font-medium hover:underline hover:text-[#60c300] ml-1">
                                Register
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Google Login Option */}
                <div className="mt-4">
                    <GoogleLogin />
                </div>

                {/* Toast Message Container */}
                <ToastContainer />
            </div>
        </div>
    );
};

export default Login;
