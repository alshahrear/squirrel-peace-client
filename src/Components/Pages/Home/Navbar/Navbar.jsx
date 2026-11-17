import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt, FaUserCircle, FaPlus } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import Swal from "sweetalert2";
import useAuth from "../../../../hooks/useAuth";
import useAdmin from "../../../../hooks/useAdmin";
import { isDraftEnabled, setDraftEnabled } from "../../../../hooks/useDraftState";
import { useClientAuth } from "../../../../hooks/ClientAuthContext";
import log from "../../../../assets/squirrel-peace-logo.png";
import fav from "../../../../assets/squirrelpeacelogo.png";
import Drawer from "./Drawer";
import MobileBottomNav from "./MobileBottomNav";
import { canAccessPath } from "../../../../hooks/permissionConfig";

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
      className="flex items-center gap-2 cursor-pointer focus:outline-none"
    >
      <span className={`relative inline-block w-9 h-5 rounded-full transition-colors duration-200 ${on ? "bg-brand-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? "translate-x-4" : ""}`} />
      </span>
      {!compact && <span className="text-xs font-medium text-slate-600">Save Draft</span>}
    </button>
  );
};

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";

const ProfileAvatar = ({ name, size = "h-9 w-9", text = "text-sm" }) => (
  <span className="relative inline-block">
    <span className={`${size} ${text} rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center`}>
      {getInitials(name)}
    </span>
    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
  </span>
);

const ProfileCard = ({ clientUser, handleLogout }) => {
  const navigate = useNavigate();
  return (
    <div
      tabIndex={0}
      className="dropdown-content mt-3 z-[1] w-72 max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4 border-b border-slate-100">
        <ProfileAvatar name={clientUser.name} size="h-11 w-11" text="text-base" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{clientUser.name}</p>
          <p className="text-slate-500 text-xs truncate">{clientUser.email}</p>
          {clientUser.role && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50 text-brand-700">
              {clientUser.role}
            </span>
          )}
        </div>
      </div>
      <div className="p-2">
        <button
          onClick={() => {
            if (document.activeElement) document.activeElement.blur();
            navigate("/client-profile");
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <FaUserCircle className="text-slate-400" /> Profile
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
  const [draftFeatureOn, setDraftFeatureOn] = useState(false);

  useEffect(() => {
    const loadFeatures = () => {
      fetch(`http://localhost:5000/feature`)
        .then((res) => res.json())
        .then((data) => {
          const on = data?.saveDraft === true;
          setDraftFeatureOn(on);
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
  const { clientUser, clientLogout } = useClientAuth();
  const canCreateOrder = !clientUser?.isStaff || canAccessPath(clientUser?.permissions, "/create-order");
  const onLoginPage = location.pathname === "/login-client";

  const handleLogout = async () => {
    if (document.activeElement) document.activeElement.blur();
    const result = await Swal.fire({
      title: "আপনি কি লগ আউট করতে চান?",
      text: "লগ আউট করলে আবার লগইন করতে হবে।",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ",
      cancelButtonText: "না",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
      width: 380,
      customClass: {
        popup: "!rounded-2xl",
        title: "!text-lg !font-bold !text-slate-800",
        htmlContainer: "!text-sm !text-slate-500",
        confirmButton: "!rounded-full !px-6 !text-sm !font-semibold",
        cancelButton: "!rounded-full !px-6 !text-sm !font-semibold",
      },
    });
    if (!result.isConfirmed) return;
    await clientLogout();
    navigate("/login-client");
  };

  const navLinkStyle = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium transition ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <div className="bg-white relative z-50">
        <div className="max-w-[1700px] mx-auto h-[60px] px-3 sm:px-5 flex items-center justify-between gap-3">

          {/* Left: menu + logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <NavLink to="/" aria-label="Go to Home" className="flex items-center gap-2">
              <img src={fav} alt="Logo" className="h-7 w-7 object-cover rounded-md" />
              <img src={log} alt="Bashay Bazar" className="h-5 w-auto hidden sm:block" />
            </NavLink>

            {clientUser && (
              <button
                type="button"
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-label={drawerOpen ? "Close Menu" : "Open Menu"}
                aria-expanded={drawerOpen}
                className={`drawer-toggle-btn hidden lg:flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 cursor-pointer ${drawerOpen
                  ? "bg-brand-100 text-brand-700 shadow-inner"
                  : "bg-brand-50 text-brand-700 hover:bg-brand-100 shadow-sm"
                  }`}
              >
                <span className={`inline-flex transition-transform duration-200 ${drawerOpen ? "rotate-90" : "rotate-0"}`}>
                  {drawerOpen ? <FaTimes className="text-[15px]" /> : <FaBars className="text-[15px]" />}
                </span>
              </button>
            )}

            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {!clientUser && <NavLink to="/" className={navLinkStyle}>Home</NavLink>}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {draftFeatureOn && clientUser && !onLoginPage && (
              <>
                <span className="sm:hidden"><DraftToggle compact /></span>
                <span className="hidden sm:block"><DraftToggle /></span>
              </>
            )}

            {clientUser && !onLoginPage && (
              <NavLink
                to="/create-order"
                className={`h-9 px-3 sm:px-4 items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition ${canCreateOrder ? "hidden lg:inline-flex" : "hidden"}`}
              >
                <FaPlus className="text-xs" />
                <span className="hidden sm:inline">Create Order</span>
                <span className="sm:hidden">Order</span>
              </NavLink>
            )}

            {user && isAdmin && (
              <NavLink
                to="/admin-pages"
                title="Admin Dashboard"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
              >
                <RiAdminFill className="text-lg" />
              </NavLink>
            )}

            {clientUser
              ? !onLoginPage && (
                <div className="dropdown dropdown-end hidden lg:block">
                  <div tabIndex={0} role="button" className="cursor-pointer rounded-full">
                    <ProfileAvatar name={clientUser.name} />
                  </div>
                  <ProfileCard clientUser={clientUser} handleLogout={handleLogout} />
                </div>
              )
              : !onLoginPage && (
                <NavLink
                  to="/login-client"
                  className="h-9 px-4 inline-flex items-center rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition"
                >
                  Login
                </NavLink>
              )}
          </div>
        </div>
      </div>

      {clientUser && !onLoginPage && (
        <MobileBottomNav
          clientUser={clientUser}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
        />
      )}
      <Drawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        clientUser={clientUser}
      />
    </>
  );
};

export default Navbar;