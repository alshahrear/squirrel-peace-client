import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPublic from "./useAxiosPublic";
import useAuth from "./useAuth";
import { Helmet } from "react-helmet";
import { GiCookingPot } from "react-icons/gi";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

const BurgerSos = () => {
    const navigate = useNavigate();
    const axiosPublic = useAxiosPublic();
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) navigate("/", { replace: true });
    }, [loading, user, navigate]);

    const handleClick = async () => {
        try {
            await axiosPublic.post("/gate/step2");
            setPassword("");
            setShowPassword(false);
            setShowModal(true);
        } catch (err) {
            console.log("gate step2 failed:", err?.response?.status, err?.message);
        }
    };

    const handleSubmit = async () => {
        const value = password;
        setPassword("");
        try {
            const res = await axiosPublic.post("/gate/verify", { password: value });
            if (res.data?.ok && res.data?.token) {
                setShowModal(false);
                navigate("/login", { state: { gateToken: res.data.token } });
                return;
            }
        } catch {
            // wrong password
        }
        setShowModal(false);
    };

    if (loading || user) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[#0a0a0a] relative">
            <Helmet>
                <title>Burger Sos</title>
            </Helmet>

            {/* Hidden Button (right bottom corner) */}
            <button
                onClick={handleClick}
                aria-label="hidden"
                className="absolute right-0 bottom-0 w-4 h-4 bg-[#0a0a0a] border border-[#1f1f1f] outline-none cursor-default focus:outline-none"
            ></button>

            <p className="flex items-center gap-3 text-[#3a3a3a] text-sm tracking-widest select-none">
                <GiCookingPot className="text-2xl" />
                The only thing we have to fear is fear itself.
            </p>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-5 bg-[#111111] border border-[#2a2a2a] rounded-md shadow-2xl"
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoFocus
                                    autoComplete="off"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    className="w-64 pl-3 pr-10 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-200 caret-gray-200 outline-none focus:outline-none focus:border-[#555]"
                                />
                                <span
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded text-gray-300 hover:bg-[#222] hover:border-[#555] transition"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BurgerSos;