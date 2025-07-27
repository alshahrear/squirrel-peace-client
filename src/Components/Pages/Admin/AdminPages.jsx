import { NavLink } from "react-router-dom";
import useAuth from "../../Layout/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { FiCopy } from 'react-icons/fi';

const AdminPages = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();

    const { data: contacts = [] } = useQuery({
        queryKey: ["contacts"],
        queryFn: async () => {
            const res = await axiosPublic.get("/contact");
            return res.data;
        },
        refetchInterval: 5000,
    });
    const { data: faqs = [] } = useQuery({
        queryKey: ["faqs"],
        queryFn: async () => {
            const res = await axiosPublic.get("/faqs");
            return res.data;
        },
        refetchInterval: 5000,
    });
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await axiosPublic.get("/users");
            return res.data;
        },
        refetchInterval: 5000,
    });
    const { data: comment = [] } = useQuery({
        queryKey: ["comments"],
        queryFn: async () => {
            const res = await axiosPublic.get("/comment");
            return res.data;
        },
        refetchInterval: 5000,
    });

    const accounts = [
        { name: "Tamim", number: "7017520546866" },
        { name: "Shishir", number: "7017342178860" },
        { name: "Romio", number: "2907520730480" },
    ];

    const [copiedName, setCopiedName] = useState("");

    const handleCopy = (name, number) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(number);
            } else {
                // Fallback for insecure contexts or older browsers
                const textArea = document.createElement("textarea");
                textArea.value = number;
                textArea.style.position = "fixed";  // avoid scrolling to bottom
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedName(name);
            setTimeout(() => setCopiedName(""), 2000);
        } catch (err) {
            console.error("Copy Failed:", err);
        }
    };

    return (
        <div className="py-10 max-w-screen-xl mx-auto px-4">
            <Helmet>
                <title>AdminPanel - Storial Peace</title>
            </Helmet>
            <div className="text-center space-y-3 mb-10">
                <h1 className="text-3xl font-bold">
                    Welcome <span className="text-[#2acb35]">{user.displayName}</span> to the Main Administration Panel
                </h1>
                <p className="max-w-5xl mx-auto">
                    You are now at the control center of the dashboard. From here, you can easily manage all essential content, user activity, and website updates. Please handle everything responsibly to ensure our platform remains at its best.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 text-center justify-center gap-y-10 gap-x-4">
                <NavLink to="/contactAdmin">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {contacts.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Contact Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/faqAdmin">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {faqs.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Faq Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/users">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {users.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Users Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/commentAdmin">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {comment.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Comment Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/testimonialsAdmin">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Testimonial Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/storyBlogAdmin">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Story Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/blogPageAdmin">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Blog Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/draftBlogAdmin">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Draft Blog Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <a
                    href="https://docs.google.com/spreadsheets/d/1EVARoR00WD2E3I0oL85AQbtYvto4HGJPBfVs-axupBQ/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5"
                >
                    <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                            Business Money Receipt
                        </span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </a>

            </div>

            {/* Bank Details Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold text-center mb-5">DBBL Bank Details</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-2">
                    {accounts.map((acc) => (
                        <div
                            key={acc.number}
                            className={`p-5 border rounded shadow flex flex-col gap-3 transition-colors duration-300
                                ${copiedName === acc.name ? "bg-green-100 border-green-400" : "bg-white border-gray-300"}
                            `}
                        >
                            <p className="font-semibold text-center text-xl">{acc.name}</p>
                            <p className="text-gray-600 text-center select-all">{acc.number}</p>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => handleCopy(acc.name, acc.number)}
                                    onTouchStart={() => handleCopy(acc.name, acc.number)}
                                    className="flex w-full items-center justify-center gap-2 text-sm py-1 px-3 rounded border border-[#2acb35] text-[#2acb35] hover:bg-[#2acb35] hover:text-white transition-all duration-300 select-none"
                                    type="button"
                                >
                                    {copiedName === acc.name ? (
                                        <>
                                            <AiOutlineCheckCircle className="text-base" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <FiCopy className="text-base" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPages;
