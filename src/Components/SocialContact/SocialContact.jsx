import { BiLogoLinkedin } from "react-icons/bi";
import { GrFacebookOption } from "react-icons/gr";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { TfiPinterest } from "react-icons/tfi";
import { PiPhoneCallFill } from "react-icons/pi";
import { MdEmail } from "react-icons/md";
import { PiSealQuestionFill } from "react-icons/pi";
import { FcFaq } from "react-icons/fc";
import { NavLink } from "react-router-dom";
import { FaAward } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import useAuth from "../Layout/useAuth";
import useAdmin from "../../hooks/useAdmin";


const SocialContact = () => {
  const {user} = useAuth();
  const [isAdmin] = useAdmin();

  return (
    <div className="bg-[#262626]">
      <div className="flex justify-between max-w-screen-xl mx-auto py-2 px-3">
        <div className="flex items-center gap-8 text-white font-medium text-[16px]">
          <p className="flex items-center gap-3">
            Have any need
            <PiSealQuestionFill className="text-[#2acb35] text-xl" />
          </p>
          <p className="flex items-center gap-3">
            <PiPhoneCallFill className="text-[#2acb35] text-xl" />
            Phone: +880 1612002913
          </p>
          <p className="flex items-center gap-3">
            <MdEmail className="text-[#2acb35] text-xl" />
            Email:{" "}
            <a
              href="mailto:alshahrear1@gmail.com"
              className=" underline hover:text-[#2acb35] transition"
              onClick={(e) => {
                // এই ফাংশন শুধু নিশ্চিত করবে event ঠিক কাজ করছে
                console.log("Email link clicked");
              }}
            >
              alshahrear1@gmail.com
            </a>
          </p>
          <NavLink to="/success" className="flex items-center gap-3 link-hover hover:text-[#2acb35]">
            <FaAward className="text-[#2acb35] text-xl" />
            Success
          </NavLink>
          <NavLink to="/faq" className="flex items-center gap-3 link-hover hover:text-[#2acb35]">
            <FcFaq className="text-[#2acb35] text-xl" />
            Faq
          </NavLink>
          
          {
            user && isAdmin && 
            <NavLink to="/adminPages" className="flex items-center gap-3 link-hover hover:text-[#2acb35]">
            <RiAdminFill className="text-[#2acb35] text-xl" />
            Admin
          </NavLink>
          }
        </div>
        <div className="flex items-center space-x-5">
          <button
            title="Facebook"
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <GrFacebookOption />
          </button>
          <button
            title="Instagram"
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <RxInstagramLogo />
          </button>
          <button
            title="Twitter"
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <RiTwitterXLine />
          </button>
          <button
            title="Linkedin"
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <BiLogoLinkedin />
          </button>
          <button
            title="Pinterest"
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <TfiPinterest />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialContact;
