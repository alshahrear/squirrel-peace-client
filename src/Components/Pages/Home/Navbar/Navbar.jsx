import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaSignOutAlt, FaEnvelope } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import useAuth from "../../../Layout/useAuth";
import useAdmin from "../../../../hooks/useAdmin";
import { isDraftEnabled, setDraftEnabled } from "../../../../hooks/useDraftState";
import { useClientAuth } from "../../../Provider/ClientAuthContext";
import log from "../../../../assets/squirrel-peace-logo.png";
import fav from "../../../../assets/squirrelpeacelogo.png";
import Drawer from "./Drawer"; // ড্রয়ার কম্পোনেন্ট ইম্পোর্ট করা হলো

// Draft Save Toggle (ডিফল্ট OFF)
const DraftToggle = ({ compact = false }) => {
  const [on, setOn] = useState(isDraftEnabled());

  useEffect(() => {
    const handler = () => setOn(isDraftEnabled());
    window.addEventListener("draft-toggle-change", handler);
    return () => window.removeEventListener("draft-toggle-change", handler);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setDraftEnabled(!on)}
      title={on ? "Draft Save ON (৩ ঘণ্টা)" : "Draft Save OFF"}
      className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
    >
      <span className={`relative inline-block w-9 h-5 rounded-full transition-colors duration-200 ${on ? "bg-[#2acb35]" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-4" : ""}`} />
      </span>
      {!compact && <span className="text-xs font-semibold text-gray-600">Save Draft</span>}
    </button>
  );
};

// Role অনুযায়ী রঙ
const ROLE_STYLES = {
  Admin: { grad: "from-rose-500 to-orange-500", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  Manager: { grad: "from-indigo-500 to-purple-600", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  SR: { grad: "from-emerald-500 to-teal-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "Delivery Man": { grad: "from-amber-500 to-orange-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
};
const DEFAULT_ROLE_STYLE = { grad: "from-sky-500 to-blue-600", badge: "bg-sky-100 text-sky-700 border-sky-200" };

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";

// সুন্দর Profile Avatar (নামের অক্ষর + gradient + online dot)
const ProfileAvatar = ({ name, role, size = "w-10 h-10", text = "text-sm" }) => {
  const style = ROLE_STYLES[role] || DEFAULT_ROLE_STYLE;
  return (
    <span className="relative inline-block">
      <span className={`${size} ${text} rounded-full bg-gradient-to-br ${style.grad} text-white font-bold flex items-center justify-center ring-2 ring-white shadow-md`}>
        {getInitials(name)}
      </span>
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#2acb35] border-2 border-white rounded-full" />
    </span>
  );
};

// Profile dropdown card (Name, Email, Role, Log Out)
const ProfileCard = ({ clientUser, handleLogout }) => {
  const style = ROLE_STYLES[clientUser.role] || DEFAULT_ROLE_STYLE;
  return (
    <div
      tabIndex={0}
      className="dropdown-content mt-3 z-[1] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
    >
      <div className={`bg-gradient-to-br ${style.grad} px-5 pt-5 pb-8 flex flex-col items-center`}>
        <ProfileAvatar name={clientUser.name} role={clientUser.role} size="w-16 h-16" text="text-2xl" />
      </div>
      <div className="-mt-4 mx-4 bg-white rounded-xl shadow-md border border-gray-100 px-4 py-3 text-center">
        <p className="font-bold text-gray-800 text-base truncate">{clientUser.name}</p>
        <p className="text-gray-500 text-xs flex items-center justify-center gap-1.5 mt-1 truncate">
          <FaEnvelope className="shrink-0 text-gray-400" /> <span className="truncate">{clientUser.email}</span>
        </p>
        {clientUser.role && (
          <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold border ${style.badge}`}>
            {clientUser.role}
          </span>
        )}
      </div>
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 text-white font-semibold text-sm py-2 rounded-xl shadow-sm transition"
        >
          <FaSignOutAlt /> Log Out
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Feature settings (database থেকে)
  const [draftFeatureOn, setDraftFeatureOn] = useState(false);

  useEffect(() => {
    const loadFeatures = () => {
      fetch("http://localhost:5000/feature")
        .then((res) => res.json())
        .then((data) => {
          const on = data?.saveDraft === true;
          setDraftFeatureOn(on);
          // Feature বন্ধ হলে draft save ও বন্ধ + সব draft মুছে যাবে
          if (!on && isDraftEnabled()) setDraftEnabled(false);
        })
        .catch((error) => console.error("Error fetching features:", error));
    };

    loadFeatures();
    window.addEventListener("feature-change", loadFeatures);
    return () => window.removeEventListener("feature-change", loadFeatures);
  }, []);
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
    `text-lg font-semibold rounded block py-2 px-3 ${isActive ? "text-[#2acb35]" : "text-black"
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
                  className="drawer-toggle-btn p-1 text-gray-700 hover:text-[#2acb35] focus:outline-none transition"
                  aria-label="Toggle Menu"
                >
                  <FaBars className="text-2xl" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Draft Save Toggle (Create Order এর বামে) */}
              {draftFeatureOn && clientUser && location.pathname !== '/login-client' && <DraftToggle compact />}

              {/* ক্লায়েন্ট লগইন করা থাকলে Create Order বাটন দেখাবে */}
              {clientUser && location.pathname !== '/login-client' && (
                <NavLink
                  to="/create-order"
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
                      <ProfileAvatar name={clientUser.name} role={clientUser.role} size="w-10 h-10" />
                    </div>
                  </div>
                  <ProfileCard clientUser={clientUser} handleLogout={handleLogout} />
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
                className="drawer-toggle-btn p-2 text-gray-700 hover:text-[#2acb35] hover:bg-gray-200 rounded-lg transition focus:outline-none flex items-center gap-2 font-medium"
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
            {/* Draft Save Toggle (Create Order এর বামে) */}
            {draftFeatureOn && clientUser && location.pathname !== '/login-client' && <DraftToggle />}

            {/* ক্লায়েন্ট লগইন করা থাকলে Create Order বাটন দেখাবে */}
            {clientUser && location.pathname !== '/login-client' && (
              <NavLink
                to="/create-order"
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
                    <ProfileAvatar name={clientUser.name} role={clientUser.role} size="w-10 h-10" />

                  </div>
                  <ProfileCard clientUser={clientUser} handleLogout={handleLogout} />
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

      {/* --- আলাদা করা Drawer কম্পোনেন্ট এখানে কল করা হয়েছে --- */}
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