import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";
import { HiMenuAlt1 } from "react-icons/hi";
import useAdmin from "../../../../hooks/useAdmin";

const Navbar = () => {
    const { user, logOut } = useAuth();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isAdmin] = useAdmin();

    const handleSignOut = () => {
        logOut().then().catch();
    };

    // ✅ Check if current path is under blog or blog details
    const isBlogActive = location.pathname.startsWith("/lifeStyle")
        || location.pathname.startsWith("/travel")
        || location.pathname.startsWith("/health")
        || location.pathname.startsWith("/blog");

    const navLinkStyle = ({ isActive }) =>
        `text-lg font-semibold rounded ${isActive ? "text-[#2acb35]" : "text-black"} hover:bg-gray-200`;

    const dropdownLinkStyle = ({ isActive }) =>
        `hover:bg-[#2acb35] text-base font-semibold hover:text-white ${isActive ? "text-[#2acb35]" : ""}`;

    return (
        <div className="bg-[#f7f7f7] relative z-50 shadow-xs">
            <div className="navbar max-w-screen-xl mx-auto px-4 justify-between lg:justify-normal">
                {/* ✅ Mobile View */}
                <div className="flex justify-between w-full lg:hidden items-center py-3">
                    <h2 className="text-2xl font-semibold">Squirrel Peace</h2>
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="bg-[#2acb35] w-10 h-10 flex items-center justify-center rounded-lg shadow"
                    >
                        <HiMenuAlt1 className="text-white text-2xl" />
                    </button>
                </div>

                {/* ✅ Desktop - Start */}
                <div className="navbar-start hidden lg:flex">
                    <h2 className="text-2xl font-semibold ml-3">Squirrel Peace</h2>
                </div>

                {/* ✅ Desktop - Center */}
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 space-x-16">
                        <li><NavLink to="/" className={navLinkStyle}>Home</NavLink></li>
                        <li><NavLink to="/about" className={navLinkStyle}>About</NavLink></li>
                        <li className="relative group">
                            <div className={`text-lg font-semibold rounded cursor-pointer ${isBlogActive ? "text-[#2acb35]" : "text-black"} hover:bg-gray-200`}>
                                Blog
                            </div>
                            <ul className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-white rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <li><NavLink to="/lifeStyle" className={dropdownLinkStyle}>Life Style</NavLink></li>
                                <li><NavLink to="/travel" className={dropdownLinkStyle}>Travel</NavLink></li>
                                <li><NavLink to="/health" className={dropdownLinkStyle}>Health</NavLink></li>
                            </ul>
                        </li>
                        <li><NavLink to="/newsletter" className={navLinkStyle}>Newsletter</NavLink></li>
                        <li><NavLink to="/story" className={navLinkStyle}>Story</NavLink></li>
                        <li><NavLink to="/contact" className={navLinkStyle}>Contact</NavLink></li>
                    </ul>
                </div>

                {/* ✅ Desktop - End */}
                <div className="navbar-end hidden lg:flex">
                    {user ? (
                        <NavLink to="/">
                            <button
                                onClick={handleSignOut}
                                className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]"
                            >
                                <span className="text-lg font-medium">Log Out</span>
                            </button>
                        </NavLink>
                    ) : (
                        <NavLink to="/login">
                            <button
                                className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]"
                            >
                                <span className="text-lg font-medium">Login</span>
                            </button>
                        </NavLink>
                    )}
                </div>
            </div>

            {/* ✅ MOBILE DRAWER */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white z-[100] transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"
                    } shadow`}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-semibold">Storial Peace</h3>
                        <button onClick={() => setDrawerOpen(false)} className="text-xl font-bold">
                            ✕
                        </button>
                    </div>
                    <ul className="menu space-y-1">
                        <li className="pb-2 mb-2 border-b border-gray-200">
                            <NavLink to="/" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                Home
                            </NavLink>
                        </li>
                        <li className="pb-2 mb-2 border-b border-gray-200">
                            <NavLink to="/about" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                About
                            </NavLink>
                        </li>
                        <li tabIndex={0} className="pb-2 mb-2 border-b border-gray-200">
                            <details>
                                <summary className={`text-lg font-semibold ${isBlogActive ? "text-[#2acb35]" : "text-black"}`}>
                                    Blog
                                </summary>
                                <ul className="ml-4 space-y-1 mt-2">
                                    <li className="pb-1 border-b border-gray-100">
                                        <NavLink to="/lifeStyle" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>
                                            Life Style
                                        </NavLink>
                                    </li>
                                    <li className="pb-1 border-b border-gray-100">
                                        <NavLink to="/travel" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>
                                            Travel
                                        </NavLink>
                                    </li>
                                    <li className="pb-1 border-b border-gray-100">
                                        <NavLink to="/health" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>
                                            Health
                                        </NavLink>
                                    </li>
                                </ul>
                            </details>
                        </li>
                        <li className="pb-2 mb-2 border-b border-gray-200">
                            <NavLink to="/newsletter" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                Newsletter
                            </NavLink>
                        </li>
                        <li className="pb-2 mb-2 border-b border-gray-200">
                            <NavLink to="/story" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                Story
                            </NavLink>
                        </li>
                        <li className="pb-2 mb-2 border-b border-gray-200">
                            <NavLink to="/contact" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                Contact
                            </NavLink>
                        </li>

                        {user && isAdmin && (
                            <li className="pb-2 mb-2 border-b border-gray-200">
                                <NavLink to="/adminPages" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                                    Admin
                                </NavLink>
                            </li>
                        )}

                        <li className="mt-4">
                            {user ? (
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        setDrawerOpen(false);
                                    }}
                                    className="btn w-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]"
                                >
                                    Log Out
                                </button>
                            ) : (
                                <NavLink to="/login" onClick={() => setDrawerOpen(false)}>
                                    <button className="btn w-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35] px-8">
                                        Login
                                    </button>
                                </NavLink>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
