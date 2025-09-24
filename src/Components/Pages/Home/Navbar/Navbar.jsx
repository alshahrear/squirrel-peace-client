import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../../Layout/useAuth";
import { HiMenuAlt1 } from "react-icons/hi";
import useAdmin from "../../../../hooks/useAdmin";
import toast from "react-hot-toast";
import log from "../../../../assets/squirrel-peace-logo.png";

const Navbar = () => {
  const { user, logOut } = useAuth();
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

  const navLinkStyle = ({ isActive }) =>
    `text-lg font-semibold rounded ${
      isActive ? "text-[#2acb35]" : "text-black"
    } hover:bg-gray-200`;

  const baseDelay = 80;
  const [animatedItems, setAnimatedItems] = useState([]);

  const mobileNavItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/blog", label: "Blog" },
    { path: "/quiz", label: "Quiz" },
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
      <div className="navbar max-w-screen-xl mx-auto py-2 px-4 justify-between lg:justify-normal">
        {/* Mobile Header */}
        <div className="flex justify-between w-full lg:hidden items-center py-3">
          <NavLink to="/" aria-label="Go to Squirrel Peace Home">
            <img
              src={log}
              alt="Squirrel Peace Official Logo"
              className="h-9 w-auto"
            />
          </NavLink>
          <button
            onClick={() => setDrawerOpen(true)}
            className="bg-[#2acb35] w-10 h-10 flex items-center justify-center rounded-lg shadow"
          >
            <HiMenuAlt1 className="text-white text-2xl" />
          </button>
        </div>

        {/* Desktop Left Logo */}
        <div className="navbar-start hidden lg:flex">
          <NavLink to="/" aria-label="Go to Squirrel Peace Home">
            <img
              src={log}
              alt="Squirrel Peace Official Logo"
              className="h-9 w-auto"
            />
          </NavLink>
        </div>

        {/* Desktop Nav */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-16">
            <li><NavLink to="/" className={navLinkStyle}>Home</NavLink></li>
            <li><NavLink to="/about" className={navLinkStyle}>About</NavLink></li>
            <li><NavLink to="/blog" className={navLinkStyle}>Blog</NavLink></li>
            <li><NavLink to="/quiz" className={navLinkStyle}>Quiz</NavLink></li>
            <li><NavLink to="/newsletter" className={navLinkStyle}>Newsletter</NavLink></li>
            <li><NavLink to="/contact" className={navLinkStyle}>Contact</NavLink></li>
          </ul>
        </div>

        {/* Desktop Right Auth Button */}
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

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-[100] transform transition-transform duration-300 ease-in-out shadow ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <NavLink
              to="/"
              onClick={() => setDrawerOpen(false)}
              aria-label="Go to Squirrel Peace Home"
            >
              <img
                src={log}
                alt="Squirrel Peace Official Logo"
                className="h-8 w-auto"
              />
            </NavLink>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-xl font-extrabold"
            >
              ✕
            </button>
          </div>
          <ul className="menu space-y-1">
            {mobileNavItems.map((item, idx) => {
              const isVisible = animatedItems.includes(idx);
              const itemClasses = `transition-all duration-300 ease-in-out transform ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              } border-b border-gray-300 pb-2`;

              return (
                <li key={item.label} className={itemClasses}>
                  <NavLink
                    to={item.path}
                    className={navLinkStyle}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              );
            })}

            {/* Auth Button in Drawer */}
            <li
              className={`mt-4 transition-all duration-300 transform ${
                animatedItems.includes(mobileNavItems.length)
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
            >
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
