import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { TbPhoneCalling } from "react-icons/tb";
import toast from "react-hot-toast";
import useAuth from "../../Layout/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { Helmet } from "react-helmet";

const Register = () => {
    const axiosPublic = useAxiosPublic();
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [showErrors, setShowErrors] = useState(false);
    const { createUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleRegister = e => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const registerPassword = form.password.value;

        if (!isValidPassword(registerPassword)) {
            setShowErrors(true);
            return;
        }

        createUser(email, registerPassword)
            .then(result => {
                console.log(result.user);

                const userInfo = {
                    name: name,
                    email: email
                };

                axiosPublic.post('/users', userInfo)
                    .then(res => {
                        if (res.data.insertedId) {
                            console.log('user added to database');
                            form.reset();
                            setPassword("");
                            toast.success("Congratulation, Registration Successful!", {
                                position: "top-right",
                                duration: 2000,
                            });
                            const redirectPath = location.state?.from?.pathname || "/";
                            setTimeout(() => {
                                navigate(redirectPath);
                            }, 2100);
                        }
                    });
            })
            .catch(error => {
                console.error(error);
                toast.error("Registration Failed! Please try again.");
            });
    };

    const isValidPassword = (pwd) => {
        return (
            pwd.length >= 6 &&
            /[a-z]/.test(pwd) &&
            /[A-Z]/.test(pwd) &&
            /[0-9]/.test(pwd) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
        );
    };

    const checkStatus = {
        min: password.length >= 6,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const renderItem = (condition, text) => {
        let style = "text-gray-700";
        let icon = "⬜";

        if (condition) {
            style = "text-green-600 font-semibold";
            icon = "✅";
        } else if (showErrors) {
            style = "text-red-600 font-medium";
            icon = "❌";
        }

        return (
            <li className={`text-sm ${style}`}>
                {icon} {text}
            </li>
        );
    };

    return (
        <div className="pt-12 pb-20 max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center relative gap-10 md:gap-0">
            <Helmet>
                <title>Register - Squirrel Peace</title>
            </Helmet>

            {/* Left Section */}
            <div className="max-w-xl space-y-5 text-center md:text-left px-4 sm:px-6 md:px-0">
                <h2 className="text-4xl font-semibold">
                    <span className="text-[#2acb35]">Join Us</span> Today
                </h2>
                <p className="text-lg ">
                    Create your free account today and unlock a world of personalized features just for you. Join our community to stay updated, manage your preferences, and enjoy seamless access to all our services. Getting started is quick and easy — let's begin your journey with us!
                </p>
                <p className="text-lg">
                   Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-[#2acb35] underline hover:text-[#1a9d29]"
                    >
                        Log in here
                    </Link>{" "}
                    to continue your journey with us.
                </p>

                <Link to="/contact">
                    <button className="btn px-6 py-5 text-lg font-medium rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]">
                        <TbPhoneCalling className="text-lg" /> Contact Us
                    </button>
                </Link>
            </div>
            {/* Right Section */}
            <div className="w-full md:w-3/7">
                <form onSubmit={handleRegister}>
                    <div className="p-8 border-2 border-gray-300 rounded-lg shadow-lg">
                        <h2 className="text-3xl text-center font-bold mb-6 text-[#2acb35]">
                            Register Now
                        </h2>
                        <div className="mb-4">
                            <label className="block mb-2 font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                name="name"
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
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
                        <div className="mb-2">
                            <label className="block mb-2 text-gray-700 font-medium">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    autoComplete="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setShowErrors(false);
                                    }}
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
                        <p className="text-[#2acb35] text-lg font-semibold">Password must be -</p>
                        <ul className="mb-4 ml-2 mt-3 space-y-1">
                            {renderItem(checkStatus.min, "Minimum 6 characters")}
                            {renderItem(checkStatus.upper, "At least one uppercase letter")}
                            {renderItem(checkStatus.lower, "At least one lowercase letter")}
                            {renderItem(checkStatus.number, "At least one number")}
                            {renderItem(checkStatus.special, "At least one special character such as ( @#$%^&*? )")}
                        </ul>
                        <button
                            type="submit"
                            className="btn w-full py-2 text-lg font-semibold rounded-md text-white bg-gradient-to-r from-[#2acb35] via-green-500 to-[#2acb35] shadow-md"
                        >
                            Register
                        </button>
                        <p className="text-center text-lg font-medium mt-4 text-gray-700">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[#2acb35] hover:underline hover:text-[#60c300] font-semibold">
                                Login Now
                            </Link>
                        </p>
                    </div>
                </form>
                {/* <div>
                    <GoogleLogin />
                </div> */}
            </div>
        </div>
    );
};

export default Register;
