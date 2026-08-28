import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaBars } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import useAuth from "../../../Layout/useAuth";
import useAdmin from "../../../../hooks/useAdmin";
import { useClientAuth } from "../../../Provider/ClientAuthContext";
import log from "../../../../assets/squirrel-peace-logo.png";
import fav from "../../../../assets/squirrelpeacelogo.png";
import Drawer from "./Drawer"; // ড্রয়ার কম্পোনেন্ট ইম্পোর্ট করা হলো

const Navbar = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin] = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // পেজ স্ক্রল ট্র্যাক করার স্টেট
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // সেন্ট্রাল কনটেক্সট থেকে ক্লায়েন্ট ডেটা ও লগআউট ফাংশন নেওয়া
  const { clientUser, clientLogout } = useClientAuth();

  const handleLogout = () => {
    clientLogout();
    navigate('/login-client');
  };

  const navLinkStyle = ({ isActive }) =>
    `text-lg font-semibold rounded block py-2 px-3 ${
      isActive ? "text-[#2acb35]" : "text-black"
    } hover:bg-gray-100 transition`;

  return (
    <>
      <div className="bg-[#f7f7f7] relative z-50 shadow-xs">
        <div className="navbar max-w-screen-xl mx-auto py-2 px-4 justify-between lg:justify-between">
          
          {/* Mobile Header */}
          <div className="flex justify-between w-full lg:hidden items-center py-3">
            <div className="flex items-center space-x-3">
              <NavLink to="/" aria-label="Go to Home" className="flex items-center">
                <img src={fav} alt="Favicon" className="h-7 w-7 object-cover rounded-md" />
              </NavLink>

             {/* মোবাইল ভিউতে লোগোর ডানপাশে মেনু বাটন (Drawer Trigger) */}
              {clientUser && (
                <button 
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="p-1 text-gray-700 hover:text-[#2acb35] focus:outline-none transition"
                  aria-label="Toggle Menu"
                >
                  <FaBars className="text-2xl" />
                </button>
              )}
            </div>
            
           <div className="flex items-center space-x-1 sm:space-x-2">
              {/* ক্লায়েন্ট লগইন করা থাকলে Create Order বাটন দেখাবে */}
              {clientUser && location.pathname !== '/login-client' && (
                <NavLink 
                  to="/receipt" 
                  className="bg-[#2acb35] hover:bg-green-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
                >
                  <span>Create Order</span>
                </NavLink>
              )}

              {/* মোবাইল ভিউতে অ্যাডমিন আইকন */}
              {user && isAdmin && (
                <NavLink 
                  to="/adminPages" 
                  title="Admin Dashboard"
                  className="p-2 text-gray-700 hover:text-[#2acb35] hover:bg-gray-200 rounded-full transition"
                >
                  <RiAdminFill className="text-2xl" />
                </NavLink>
              )}

              {clientUser && location.pathname !== '/login-client' ? (
                <div className="dropdown dropdown-end lg:hidden">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                    <div className="w-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700">
                      <FaUserCircle className="text-3xl" />
                    </div>
                  </div>
                  <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-3 shadow bg-white rounded-box w-52 space-y-2 border border-gray-100">
                    <li className="font-bold text-gray-800 text-base px-2 py-1 border-b">
                      {clientUser.name}
                    </li>
                    <li className="text-gray-500 text-xs px-2 truncate">
                      {clientUser.email}
                    </li>
                    <li>
                      <button 
                        onClick={handleLogout}
                        className="text-red-600 font-semibold hover:bg-red-50 w-full text-left mt-1"
                      >
                        Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                location.pathname !== '/login-client' && (
                  <NavLink 
                    to="/login-client" 
                    className="bg-[#2acb35] hover:bg-green-600 text-white font-medium px-4 py-1.5 rounded-lg text-sm shadow-sm transition"
                  >
                    Login
                  </NavLink>
                )
              )}
            </div> 
          </div>

          {/* Desktop Left Logo & Favicon + Menu Icon on the Right of Logo */}
          <div className="navbar-start hidden lg:flex items-center space-x-4">
            <NavLink to="/" aria-label="Go to Home" className="flex items-center space-x-3">
              <img src={fav} alt="Favicon" className="h-7 w-7 object-cover rounded-md" />
              <img src={log} alt="Logo" className="h-6 w-auto" />
            </NavLink>

           {/* ডেস্কটপে লোগোর ডানপাশে মেনু বাটন (Drawer Trigger) */}
            {clientUser && (
              <button 
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="p-2 text-gray-700 hover:text-[#2acb35] hover:bg-gray-200 rounded-lg transition focus:outline-none flex items-center gap-2 font-medium"
                aria-label="Toggle Menu"
              >
                <FaBars className="text-xl" />
                <span>Menu</span>
              </button>
            )}
          </div>

          {/* Desktop Nav */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1 space-x-2">
              {!clientUser && (
                <li><NavLink to="/" className={navLinkStyle}>Home</NavLink></li>
              )}
              {clientUser && (
                <li><NavLink to="/dashboard" className={navLinkStyle}>Dashboard</NavLink></li>
              )}
            </ul>
          </div>
          
         {/* Desktop Right Side: Profile or Login Button */}
          <div className="navbar-end hidden lg:flex items-center space-x-3">
            {/* ক্লায়েন্ট লগইন করা থাকলে Create Order বাটন দেখাবে */}
            {clientUser && location.pathname !== '/login-client' && (
              <NavLink 
                to="/receipt" 
                className="bg-[#2acb35] hover:bg-green-600 text-white font-semibold px-3.5 py-2 rounded-lg shadow-sm transition duration-200 text-sm flex items-center gap-1"
              >
                <span>Create Order</span>
              </NavLink>
            )}

            {/* পিসি ভিউতে অ্যাডমিন আইকন */}
            {user && isAdmin && (
              <NavLink 
                to="/adminPages" 
                title="Admin Dashboard"
                className="p-2 text-gray-700 hover:text-[#2acb35] hover:bg-gray-200 rounded-lg transition flex items-center gap-1 font-medium"
              >
                <RiAdminFill className="text-2xl" />
              </NavLink>
            )}

            {clientUser ? (
              location.pathname !== '/login-client' && (
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-gray-200">
                    <FaUserCircle className="text-3xl text-gray-700" />
                    
                  </div>
                  <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-4 shadow-lg bg-white rounded-box w-60 space-y-2 border border-gray-100">
                    <li>
                      <span className="font-bold text-gray-800 text-base p-0 pb-1 border-b block">
                        {clientUser.name}
                      </span>
                    </li>
                    <li>
                      <span className="text-gray-500 text-sm p-0 truncate block">
                        {clientUser.email}
                      </span>
                    </li>
                    <li className="pt-2">
                      <button 
                        onClick={handleLogout}
                        className="text-red-600 font-semibold bg-red-50 hover:bg-red-100 w-full text-center py-2 rounded-md"
                      >
                        Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              )
            ) : (
              location.pathname !== '/login-client' && (
                <NavLink 
                  to="/login-client" 
                  className="bg-[#2acb35] hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-lg shadow-sm transition duration-200"
                >
                  Login
                </NavLink>
              )
            )}
          </div>
        </div>
      </div>

      {/* --- আলাদা করা Drawer কম্পোনেন্ট এখানে কল করা হয়েছে --- */}
      <Drawer 
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        scrolled={scrolled}
        clientUser={clientUser}
        user={user}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default Navbar;