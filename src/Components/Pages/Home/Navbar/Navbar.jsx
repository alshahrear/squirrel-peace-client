import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";
import { HiMenuAlt1 } from "react-icons/hi";
import useAdmin from "../../../../hooks/useAdmin";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin] = useAdmin();

  const handleSignOut = async () => {
    try {
      await logOut();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const isBlogActive =
    location.pathname.startsWith("/lifeStyle") ||
    location.pathname.startsWith("/travel") ||
    location.pathname.startsWith("/health") ||
    location.pathname.startsWith("/education") ||
    location.pathname.startsWith("/play") ||
    location.pathname.startsWith("/blog");

  const navLinkStyle = ({ isActive }) =>
    `text-lg font-semibold rounded ${
      isActive ? "text-[#2acb35]" : "text-black"
    } hover:bg-gray-200`;

  const dropdownLinkStyle = ({ isActive }) =>
    `hover:bg-[#2acb35] text-base font-semibold hover:text-white ${
      isActive ? "text-[#2acb35]" : ""
    }`;

  const baseDelay = 80;
  const [animatedItems, setAnimatedItems] = useState([]);

  const mobileNavItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { type: "dropdown" },
    { path: "/story", label: "Story" },
    { path: "/newsletter", label: "Newsletter" },
    { path: "/success", label: "Success" },
    { path: "/faq", label: "FAQ" },
    { path: "/contact", label: "Contact" },
    ...(user && isAdmin ? [{ path: "/adminPages", label: "Admin" }] : []),
  ];

  useEffect(() => {
    if (drawerOpen) {
      const timeouts = [];
      for (let i = 0; i < mobileNavItems.length + 1; i++) {
        const timeout = setTimeout(() => {
          setAnimatedItems((prev) => [...prev, i]);
        }, baseDelay * i);
        timeouts.push(timeout);
      }
      return () => timeouts.forEach(clearTimeout);
    } else {
      setAnimatedItems([]);
    }
  }, [drawerOpen]);

  return (
    <div className="bg-[#f7f7f7] relative z-50 shadow-xs">
      <div className="navbar max-w-screen-xl mx-auto px-4 justify-between lg:justify-normal">
        <div className="flex justify-between w-full lg:hidden items-center py-3">
          <h2 className="text-2xl font-semibold">Squirrel Peace</h2>
          <button
            onClick={() => setDrawerOpen(true)}
            className="bg-[#2acb35] w-10 h-10 flex items-center justify-center rounded-lg shadow"
          >
            <HiMenuAlt1 className="text-white text-2xl" />
          </button>
        </div>

        <div className="navbar-start hidden lg:flex">
          <h2 className="text-2xl font-semibold ml-3">Squirrel Peace</h2>
        </div>

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
                <li><NavLink to="/education" className={dropdownLinkStyle}>Education</NavLink></li>
                <li><NavLink to="/play" className={dropdownLinkStyle}>Play</NavLink></li>
              </ul>
            </li>
            <li><NavLink to="/story" className={navLinkStyle}>Story</NavLink></li>
            <li><NavLink to="/newsletter" className={navLinkStyle}>Newsletter</NavLink></li>
            <li><NavLink to="/contact" className={navLinkStyle}>Contact</NavLink></li>
          </ul>
        </div>

        <div className="navbar-end hidden lg:flex">
          {user ? (
            <button
              onClick={handleSignOut}
              className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]"
            >
              <span className="text-lg font-medium">Log Out</span>
            </button>
          ) : (
            <NavLink to="/login">
              <button className="btn px-7 py-5 rounded-full text-white border-2 bg-[#2acb35] hover:text-[#404040] hover:bg-white hover:border-[#2acb35]">
                <span className="text-lg font-medium">Login</span>
              </button>
            </NavLink>
          )}
        </div>
      </div>

      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-[100] transform transition-transform duration-300 ease-in-out shadow ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Squirrel Peace</h3>
            <button onClick={() => setDrawerOpen(false)} className="text-xl font-bold">✕</button>
          </div>
          <ul className="menu space-y-1">
            {mobileNavItems.map((item, idx) => {
              const isVisible = animatedItems.includes(idx);
              const itemClasses = `transition-all duration-300 ease-in-out transform ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
              } border-b border-gray-300 pb-2`;

              if (item.type === "dropdown") {
                return (
                  <li key="blog" className={itemClasses}>
                    <details>
                      <summary className={`text-lg font-semibold ${isBlogActive ? "text-[#2acb35]" : "text-black"}`}>Blog</summary>
                      <ul className="ml-4 space-y-1 mt-2">
                        <li><NavLink to="/lifeStyle" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Life Style</NavLink></li>
                        <li><NavLink to="/travel" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Travel</NavLink></li>
                        <li><NavLink to="/health" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Health</NavLink></li>
                        <li><NavLink to="/education" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Education</NavLink></li>
                        <li><NavLink to="/play" className={dropdownLinkStyle} onClick={() => setDrawerOpen(false)}>Play</NavLink></li>
                      </ul>
                    </details>
                  </li>
                );
              }

              return (
                <li key={item.label} className={itemClasses}>
                  <NavLink to={item.path} className={navLinkStyle} onClick={() => setDrawerOpen(false)}>
                    {item.label}
                  </NavLink>
                </li>
              );
            })}

            <li className={`mt-4 transition-all duration-300 transform ${
              animatedItems.includes(mobileNavItems.length) ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
            }`}>
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
