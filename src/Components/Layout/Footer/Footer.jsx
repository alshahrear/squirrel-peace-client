import { GrFacebookOption } from "react-icons/gr";
import { RxInstagramLogo } from "react-icons/rx";
import { RiTwitterXLine } from "react-icons/ri";
import { BiLogoLinkedin } from "react-icons/bi";

import { IoLogoYoutube } from "react-icons/io";

import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { FaLock, FaKey } from "react-icons/fa6";
import useAuth from "../useAuth";
import useAdmin from "../../../hooks/useAdmin";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const Footer = () => {
  const { user, logOut } = useAuth();
  const [isAdmin] = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // সিক্রেট লগইন বা আনলক বাটনের হ্যান্ডলার ফাংশন
  const handleSecretLogin = async () => {
    if (isAdmin) {
      try {
        await logOut();
        toast.success("Logged out successfully!");
        navigate("/");
      } catch {
        toast.error("Logout failed. Please try again.");
      }
      return;
    }

   const { value: password } = await Swal.fire({
      title: "Enter Secret Password",
      input: "password",
      inputPlaceholder: "Enter your password",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        autocomplete: "new-password",
        name: "random-secret-password-field"
      },
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33"
    });

    if (password) {
      if (password === "Ok132@?") {
        toast.success("Access Granted!");
        sessionStorage.setItem("allow_login", "true"); // এটি যোগ করতে হবে
        navigate("/login");
      } else {
        toast.error("Incorrect Password!");
      }
    }
  };

  return (
    <div className="bg-[#222426] mt-auto w-full">
      <footer className="footer bg-[#1c1e20] text-[#878787] text-lg font-semibold border-base-300 px-4 md:px-10 py-3">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 text-[14px]">
          <div>
            <p>
              © {new Date().getFullYear()} All Rights Reserved, Powered by{" "}
              <span className="text-[#2acb35]">Squirrel Peace</span>.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10">
            <p className="link-hover text-[16px] hover:text-[#2acb35]">
              <NavLink to="">Privacy policy</NavLink>
            </p>
            <p className="link-hover text-[16px] hover:text-[#2acb35]">
              <NavLink to="">Terms of Condition</NavLink>
            </p>
          </div>
          <div className="flex items-center space-x-5">
            {/* isAdmin true হলে চাবি এবং false হলে লক আইকন */}
            <button
              title={isAdmin ? "Logout Admin" : "Secret Access"}
              onClick={handleSecretLogin}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              {isAdmin ? <FaKey /> : <FaLock />}
            </button>

            <button
              title="Facebook"
              onClick={() => window.open('https://www.facebook.com/squirrelpeace', '_blank')}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <GrFacebookOption />
            </button>
            <button
              title="Instagram"
              onClick={() => window.open('https://www.instagram.com/squirrelpeace/', '_blank')}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <RxInstagramLogo />
            </button>
            <button
              title="Twitter"
              onClick={() => window.open('https://x.com/squirrelpeace', '_blank')}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <RiTwitterXLine />
            </button>
            <button
              title="Linkedin"
              onClick={() => window.open('https://www.linkedin.com/in/squirrel-peace-146019379/', '_blank')}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <BiLogoLinkedin />
            </button>
            
            <button
              title="YouTube"
              onClick={() => window.open('https://www.youtube.com/@squirrelpeace', '_blank')}
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <IoLogoYoutube />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;