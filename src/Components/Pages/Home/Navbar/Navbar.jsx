import { NavLink } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";

const Navbar = () => {
    const { user, logOut } = useAuth();

    const handleSignOut = () => {
        logOut()
            .then()
            .catch();
    };

    const navLinks = <>
        <li className="text-lg font-semibold"><NavLink>Home</NavLink></li>
        <li className="text-lg font-semibold"><NavLink to="/aboutPage">About</NavLink></li>
        <div className="dropdown-hover">
            <li className="dropdown ">
                <div tabIndex={0} role="button" className="text-lg font-semibold">Blog</div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm font-semibold">
                    <li><NavLink to="/lifeStylePages">Life Style</NavLink></li>
                    <li><a>Travel</a></li>
                    <li><a>Health</a></li>
                </ul>
            </li>
        </div>
        <li className="text-lg font-semibold"><NavLink to="/storyPages">Story</NavLink></li>
        <li className="text-lg font-semibold"><NavLink to="/newsletterPage">Newsletter</NavLink></li>
        <li className="text-lg font-semibold"><NavLink to="/contact">Contact</NavLink></li>
    </>
    return (
        <div className="bg-[#f7f7f7]">
            <div className="navbar max-w-screen-xl mx-auto">
                <div className="navbar-start">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
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
                    <ul className="menu menu-horizontal px-1 space-x-7">
                        {navLinks}
                    </ul>
                </div>
                <div className="navbar-end">
                    {
                        user ?
                            <>
                                <NavLink to="/">
                                    <button onClick={handleSignOut} className="btn px-8 py-6 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040]  hover:bg-white hover:border-[#2acb35]  "><span className="relative text-lg font-medium ">Log Out</span>
                                        <GiCurledLeaf className="absolute text-2xl top-4 ml-20"></GiCurledLeaf>
                                    </button>
                                </NavLink>
                            </> :
                            <>
                                <NavLink to="/login">
                                    <button className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040]  hover:bg-white hover:border-[#2acb35]  "><span className="text-lg font-medium ">Login</span>
                                    </button>
                                </NavLink>
                            </>
                    }
                </div>
            </div>
        </div>
    );
};

export default Navbar;