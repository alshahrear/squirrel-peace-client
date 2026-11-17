import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import toast from "react-hot-toast";
import useAuth from "./useAuth";
import useAxiosPublic from "./useAxiosPublic";
import { Helmet } from "react-helmet";

const inputCls =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelCls = "block mb-1.5 text-xs font-medium text-slate-600";

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
                const userInfo = {
                    name: name,
                    email: email
                };

                result.user.getIdToken()
                    .then(idToken => axiosPublic.post('/users', userInfo, { headers: { authorization: `Bearer ${idToken}`, 'x-gate-token': location.state?.gateToken || '' } }))
                    .then(res => {
                        if (res.data.insertedId) {
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

    const rules = [
        { ok: password.length >= 6, text: "6+ characters" },
        { ok: /[a-z]/.test(password), text: "Lowercase letter" },
        { ok: /[A-Z]/.test(password), text: "Uppercase letter" },
        { ok: /[0-9]/.test(password), text: "Number" },
        { ok: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: "Special character" },
    ];

    if (!allowed) return null;

    return (
        <div className="min-h-[calc(100dvh-61px)] flex items-center justify-center p-3 sm:p-5">
            <Helmet>
                <title>Register - Bashay Bazar</title>
            </Helmet>

            <div className="w-full max-w-md">
                <form onSubmit={handleRegister}>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                </svg>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Register</h1>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="reg-name" className={labelCls}>Name</label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                className={inputCls}
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="reg-email" className={labelCls}>Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                className={inputCls}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="reg-password" className={labelCls}>Password</label>
                            <div className="relative">
                                <input
                                    id="reg-password"
                                    name="password"
                                    autoComplete="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setShowErrors(false);
                                    }}
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

                            {(password || showErrors) && (
                                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                                    {rules.map((r) => (
                                        <li
                                            key={r.text}
                                            className={`flex items-center gap-1.5 text-xs ${r.ok
                                                ? "text-emerald-600 font-semibold"
                                                : showErrors
                                                    ? "text-rose-600 font-medium"
                                                    : "text-slate-400"
                                                }`}
                                        >
                                            <span className="w-3 text-center">{r.ok ? "✓" : showErrors ? "✕" : "•"}</span>
                                            {r.text}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-3 shadow-sm"
                        >
                            Register
                        </button>

                        <p className="text-center text-sm text-slate-600 mt-5">
                            Already have an account?
                            <Link
                                to="/login"
                                state={{ gateToken: location.state?.gateToken }}
                                className="text-brand-600 font-semibold hover:underline ml-1"
                            >
                                Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;