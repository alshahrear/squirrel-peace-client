import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";
import { HiMenuAlt1 } from "react-icons/hi";

const Navbar = () => {
    const { user, logOut } = useAuth();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [blogDropdownOpen, setBlogDropdownOpen] = useState(false);

    const handleSignOut = () => {
        logOut().then().catch();
    };

    const isBlogActive = ["/lifeStylePages", "/travelPages", "/healthPages"].includes(location.pathname);

    const navLinkStyle = ({ isActive }) =>
        `text-lg font-semibold rounded ${isActive ? "text-[#2acb35]" : "text-black"} hover:bg-gray-200`;

    const dropdownLinkStyle = ({ isActive }) =>
        `hover:bg-[#2acb35] text-base font-semibold hover:text-white ${isActive ? "text-[#2acb35]" : ""}`;

    return (
        <div className="bg-[#f7f7f7]">
            <div className="navbar max-w-screen-xl mx-auto px-4">
                {/* START */}
                <div className="navbar-start">
                    <div className="lg:hidden">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="bg-[#2acb35] w-10 h-10 flex items-center justify-center rounded-lg shadow"
                        >
                            <HiMenuAlt1 className="text-white text-2xl" />
                        </button>
                    </div>
                    <h2 className="text-2xl font-semibold ml-3">Squirrel Peace</h2>
                </div>

                {/* CENTER - Desktop View */}
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 space-x-16">
                        <li>
                            <NavLink to="/" className={navLinkStyle}>Home</NavLink>
                        </li>
                        <li>
                            <NavLink to="/about" className={navLinkStyle}>About</NavLink>
                        </li>

                        {/* Blog Dropdown */}
                        <li
                            className="relative"
                            onMouseEnter={() => setBlogDropdownOpen(true)}
                            onMouseLeave={() => setBlogDropdownOpen(false)}
                        >
                            <div
                                className={`text-lg font-semibold rounded cursor-pointer ${isBlogActive ? "text-[#2acb35]" : "text-black"} hover:bg-gray-200`}
                            >
                                Blog
                            </div>
                            {blogDropdownOpen && (
                                <ul
                                    tabIndex={0}
                                    className="dropdown-content menu bg-base-100 rounded-box shadow font-semibold w-52 absolute top-8 left-1/2 -translate-x-1/2 z-10"
                                >
                                    <li><NavLink to="/lifeStyle" className={dropdownLinkStyle}>Life Style</NavLink></li>
                                    <li><NavLink to="/travel" className={dropdownLinkStyle}>Travel</NavLink></li>
                                    <li><NavLink to="/health" className={dropdownLinkStyle}>Health</NavLink></li>
                                </ul>
                            )}
                        </li>

                        <li><NavLink to="/newsletter" className={navLinkStyle}>Newsletter</NavLink></li>
                        <li><NavLink to="/story" className={navLinkStyle}>Story</NavLink></li>
                        <li><NavLink to="/contact" className={navLinkStyle}>Contact</NavLink></li>
                    </ul>
                </div>

                {/* END */}
                <div className="navbar-end">
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

            {/* ✅ MOBILE DRAWER (Unchanged) */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-white z-[100] transform transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} shadow`}>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Menu</h3>
                        <button onClick={() => setDrawerOpen(false)} className="text-xl font-bold">✕</button>
                    </div>
                    <ul className="menu space-y-1">
                        <li><NavLink to="/" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>Home</NavLink></li>
                        <li><NavLink to="/about" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>About</NavLink></li>
                        <li tabIndex={0}>
                            <details>
                                <summary className={`text-lg font-semibold ${isBlogActive ? "text-[#2acb35]" : "text-black"}`}>Blog</summary>
                                <ul className="ml-4">
                                    <li><NavLink to="/lifeStyle" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Life Style</NavLink></li>
                                    <li><NavLink to="/travel" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Travel</NavLink></li>
                                    <li><NavLink to="/health" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Health</NavLink></li>
                                </ul>
                            </details>
                        </li>
                        <li><NavLink to="/newsletter" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>Newsletter</NavLink></li>
                        <li><NavLink to="/story" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>Story</NavLink></li>
                        <li><NavLink to="/contact" className={navLinkStyle} onClick={() => setDrawerOpen(false)}>Contact</NavLink></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
