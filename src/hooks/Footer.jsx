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
    <div className="bg-[#222426] mt-auto w-full">
      <footer className="footer bg-[#1c1e20] text-[#878787] text-[14px] font-semibold border-base-300 px-4 md:px-10 py-3 min-h-0">
        <div className="w-full flex justify-between items-center">
          <p>
            © {new Date().getFullYear()} All Rights Reserved, Powered by{" "}
            <span className="text-[#2acb35]">Squirrel Peace</span>.
          </p>
          {user && (
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <span
                  title="Logged in as Admin"
                  className="flex items-center gap-1.5 text-[#2acb35]"
                >
                  <FaUserShield className="text-lg" />
                
                </span>
              ) : (
                <span
                  title="Logged in as User"
                  className="flex items-center gap-1.5 text-[#878787]"
                >
                  <FaUser className="text-base" />
                  
                </span>
              )}
              <button
                onClick={handleAdminLogout}
                title="Logout"
                className="p-1.5 text-[#878787] hover:text-red-500 transition"
              >
                <FaSignOutAlt className="text-lg" />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Footer;