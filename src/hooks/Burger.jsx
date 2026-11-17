import { Helmet } from "react-helmet";
import { GiCookingPot } from "react-icons/gi";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAxiosPublic from "./useAxiosPublic";
import useAuth from "./useAuth";

const Burger = () => {
    const axiosPublic = useAxiosPublic();
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) navigate("/", { replace: true });
    }, [loading, user, navigate]);

    if (loading || user) return null;

    return (
        <div className="relative min-h-[calc(100dvh-61px)] w-full flex items-center justify-center px-4 bg-[#0a0a0a]">
            <Helmet>
                <title>Burger</title>
            </Helmet>

            {/* Hidden Button (left bottom corner, invisible, 44px touch area for phones) */}
            <button
                onClick={() => axiosPublic.post("/gate/step1").catch(() => { })}
                aria-label="hidden"
                className="absolute left-0 bottom-0 w-11 h-11 p-0 border-0 bg-transparent outline-none cursor-default focus:outline-none"
            ></button>

            <p className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center text-[#3a3a3a] text-xs sm:text-sm tracking-widest select-none">
                <GiCookingPot className="text-2xl shrink-0" />
                Something is cooking here, work in progress...
            </p>
        </div>
    );
};

export default Burger;