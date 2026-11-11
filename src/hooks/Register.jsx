import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import toast from "react-hot-toast";
import useAuth from "./useAuth";
import useAxiosPublic from "./useAxiosPublic";
import { Helmet } from "react-helmet";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const axiosPublic = useAxiosPublic();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const token = location.state?.gateToken;
        if (!token) {
            navigate("/", { replace: true });
            return;
        }
        axiosPublic.post("/gate/check", { token })
            .then(() => setAllowed(true))
            .catch(() => navigate("/", { replace: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [showErrors, setShowErrors] = useState(false);
    const { createUser } = useAuth();


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
                // console.log(result.user);

                const userInfo = {
                    name: name,
                    email: email
                };

                result.user.getIdToken()
                    .then(idToken => axiosPublic.post('/users', userInfo, { headers: { authorization: `Bearer ${idToken}`, 'x-gate-token': location.state?.gateToken || '' } }))
                    .then(res => {
                        if (res.data.insertedId) {
                            // console.log('user added to database');
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
        let style = "text-gray-600";
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

    if (!allowed) return null;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
            <Helmet>
                <title>Register - Squirrel Peace</title>
            </Helmet>

            {/* Register Form */}
            <div className="w-full max-w-md">
                <form onSubmit={handleRegister}>
                    <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100">
                        {/* Top Accent Bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-[#2acb35] via-emerald-400 to-[#2acb35]"></div>

                        <div className="p-8 sm:p-10">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-800">
                                    Register <span className="text-[#2acb35]">Now</span>
                                </h2>
                                <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[#2acb35]"></div>
                            </div>

                            <div className="mb-5">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:bg-white focus:border-[#2acb35] focus:ring-4 focus:ring-green-100"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div className="mb-5">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:bg-white focus:border-[#2acb35] focus:ring-4 focus:ring-green-100"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block mb-2 text-sm font-semibold text-gray-700">Password</label>
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

                            <button
                                type="submit"
                                className="btn w-full h-12 border-none text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-[#2acb35] via-green-500 to-[#2acb35] shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                            >
                                Register
                            </button>
                            <p className="text-center text-base font-medium mt-6 text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    state={{ gateToken: location.state?.gateToken }}
                                    className="text-[#2acb35] hover:underline font-semibold"
                                >
                                    Login Now
                                </Link>
                            </p>
                        </div>
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