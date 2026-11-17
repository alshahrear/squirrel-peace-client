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
        <div className="relative min-h-[calc(100dvh-61px)] w-full flex items-center justify-center px-4 bg-[#0a0a0a]">
            <Helmet>
                <title>Burger Sos</title>
            </Helmet>

            {/* Hidden Button (right bottom corner, invisible, 44px touch area for phones) */}
            <button
                onClick={handleClick}
                aria-label="hidden"
                className="absolute right-0 bottom-0 w-11 h-11 p-0 border-0 bg-transparent outline-none cursor-default focus:outline-none"
            ></button>

            <p className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center text-[#3a3a3a] text-xs sm:text-sm tracking-widest select-none">
                <GiCookingPot className="text-2xl shrink-0" />
                The only thing we have to fear is fear itself.
            </p>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm p-4 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl"
                    >
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoFocus
                                    autoComplete="off"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    className="w-full h-11 pl-3 pr-11 bg-[#0a0a0a] border border-[#333] rounded-lg text-base text-gray-200 caret-gray-200 outline-none focus:outline-none focus:border-[#555]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide" : "Show"}
                                    className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center bg-transparent border-0 p-0 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="h-11 px-5 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-gray-300 hover:bg-[#222] hover:border-[#555] transition"
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