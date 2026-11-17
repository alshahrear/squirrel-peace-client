import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUser, FaUserShield } from "react-icons/fa";
import useAuth from "./useAuth";
import useAdmin from "./useAdmin";

const Footer = () => {
  const { user, logOut } = useAuth();
  const [isAdmin] = useAdmin();
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    logOut().then(() => navigate("/"));
  };

  return (
    <footer className="mt-auto w-full px-3 sm:px-5 pb-3 pt-2">
      <div className="max-w-[1700px] mx-auto rounded-2xl border border-white/80 bg-white/70 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] text-slate-500">
        <p>
          © {new Date().getFullYear()} All Rights Reserved. Powered by{" "}
          <span className="font-semibold text-brand-600">Bashay Bazar</span>
        </p>

        {user && (
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <span
                title="Logged in as Admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 font-medium"
              >
                <FaUserShield className="text-sm" /> Admin
              </span>
            ) : (
              <span
                title="Logged in as User"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 font-medium"
              >
                <FaUser className="text-xs" /> User
              </span>
            )}
            <button
              onClick={handleAdminLogout}
              title="Logout"
              className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <FaSignOutAlt className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;