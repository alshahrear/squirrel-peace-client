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
        {
            name: "Tamim",
            accounts: [
                { label: "City", number: "2304461313001" },
                { label: "DBBL", number: "7017520546866" },
                { label: "BKASH", number: "01877908888" },
            ],
        },
        {
            name: "Shishir",
            accounts: [
                { label: "UCB", number: "2083201000005042" },
                { label: "DBBL", number: "7017342178860" },
                { label: "BKASH", number: "01936404039" },
            ],
        },
        // {
        //     name: "Romio",
        //     accounts: [
        //         { label: "DBBL", number: "2907520730480" },
        //         { label: "BKASH ", number: "01540658473" },
        //     ],
        // },
    ];

    const [copiedNumber, setCopiedNumber] = useState("");

    const handleCopy = (number) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(number);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = number;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopiedNumber(number);
            setTimeout(() => setCopiedNumber(""), 2000);
        } catch (err) {
            console.error("Copy Failed:", err);
        }
    };

    return (
        <div className="py-10 max-w-screen-xl mx-auto px-4">
            <Helmet>
                <title>AdminPanel - Squirrel Peace</title>
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
                <a
                    href="https://docs.google.com/spreadsheets/d/13v0vx89cQG-HOvWSNLqaj4SZEtMfUY0yKcjxfvsg-_M/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5"
                >
                    <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                            Newsletter Subscriber List
                        </span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </a>
            </div>

            {/* Bank Details Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold text-center mb-5">Bank Details (AC)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-2">
                    {accounts.map((acc) => (
                        <div
                            key={acc.name}
                            className="p-5 border rounded shadow bg-white border-gray-300"
                        >
                            <p className="font-semibold text-center text-xl mb-3">{acc.name}</p>
                            {acc.accounts.map(({ label, number }) => (
                                <div key={number} className={`mb-3 p-3 rounded border ${copiedNumber === number ? 'bg-green-100 border-green-400' : 'border-gray-300'}`}>
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-gray-700 font-medium">{label}</span>
                                        <span className="text-gray-600 select-all text-sm">{number}</span>
                                        <button
                                            onClick={() => handleCopy(number)}
                                            onTouchStart={() => handleCopy(number)}
                                            className="flex items-center gap-1 px-2 py-1 border border-[#2acb35] text-[#2acb35] hover:bg-[#2acb35] hover:text-white rounded text-xs transition-all"
                                        >
                                            {copiedNumber === number ? (
                                                <>
                                                    <AiOutlineCheckCircle className="text-sm" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <FiCopy className="text-sm" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPages;
