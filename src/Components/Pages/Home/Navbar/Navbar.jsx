import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";

const Navbar = () => {
    const { user, logOut } = useAuth();
    const location = useLocation();

    const handleSignOut = () => {
        logOut().then().catch();
    };

    // Check if current path is any of the blog subroutes
    const isBlogActive = ["/lifeStylePages", "/travelPages", "/healthPages"].includes(location.pathname);

    const navLinkStyle = ({ isActive }) =>
        `text-lg font-semibold rounded ${
            isActive ? "text-[#2acb35]" : "text-black"
        } hover:bg-gray-200`;

    const dropdownLinkStyle = ({ isActive }) =>
        `hover:bg-[#2acb35] hover:text-white ${
            isActive ? "text-[#2acb35]" : ""
        }`;

    const navLinks = (
        <>
            <li>
                <NavLink to="/" className={navLinkStyle}>Home</NavLink>
            </li>
            <li>
                <NavLink to="/about" className={navLinkStyle}>About</NavLink>
            </li>
            <li>
                <div className="dropdown dropdown-hover relative">
                    <div
                        tabIndex={0}
                        role="button"
                        className={`text-lg font-semibold rounded ${
                            isBlogActive ? "text-[#2acb35]" : "text-black"
                        } hover:bg-gray-200`}
                    >
                        Blog
                    </div>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box shadow font-semibold w-52 absolute left-1/2 -translate-x-1/2 z-10"
                    >
                        <li><NavLink to="/lifeStyle" className={dropdownLinkStyle}>Life Style</NavLink></li>
                        <li><NavLink to="/travel" className={dropdownLinkStyle}>Travel</NavLink></li>
                        <li><NavLink to="/health" className={dropdownLinkStyle}>Health</NavLink></li>
                    </ul>
                </div>
            </li>
            <li>
                <NavLink to="/newsletter" className={navLinkStyle}>Newsletter</NavLink>
            </li>
            <li>
                <NavLink to="/story" className={navLinkStyle}>Story</NavLink>
            </li>
            <li>
                <NavLink to="/contact" className={navLinkStyle}>Contact</NavLink>
            </li>
        </>
    );

    return (
        <div className="bg-[#f7f7f7]">
            <div className="navbar max-w-screen-xl mx-auto">
                <div className="navbar-start">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                            {navLinks}
                        </ul>
                    </div>
                    <h2 className="text-2xl font-semibold">Squirrel Peace</h2>
                </div>
                <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 space-x-16">
                        {navLinks}
                    </ul>
                </div>
                <div className="navbar-end">
                    {
                        user ? (
                            <NavLink to="/">
                                <button
                                    onClick={handleSignOut}
                                    className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]">
                                    <span className="relative text-lg font-medium">Log Out</span>
                                </button>
                            </NavLink>
                        ) : (
                            <NavLink to="/login">
                                <button
                                    className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]">
                                    <span className="text-lg font-medium">Login</span>
                                </button>
                            </NavLink>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Navbar;
