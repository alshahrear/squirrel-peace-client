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
        <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[#0a0a0a] relative">
            <Helmet>
                <title>Burger</title>
            </Helmet>

            {/* Hidden Button (left bottom corner) */}
            <button
                onClick={() => axiosPublic.post("/gate/step1").catch(() => { })}
                aria-label="hidden"
                className="absolute left-0 bottom-0 w-4 h-4 bg-[#0a0a0a] border border-[#1f1f1f] outline-none cursor-default focus:outline-none"
            ></button>

            <p className="flex items-center gap-3 text-[#3a3a3a] text-sm tracking-widest select-none">
                <GiCookingPot className="text-2xl" />
                Something is cooking here, work in progress...
            </p>
        </div>
    );
};

export default Burger;