import { BiLogoLinkedin } from "react-icons/bi";
import { GrFacebookOption } from "react-icons/gr";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { TfiPinterest } from "react-icons/tfi";
import { FaWhatsappSquare } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { PiSealQuestionFill } from "react-icons/pi";
import { FcFaq } from "react-icons/fc";
import { NavLink } from "react-router-dom";
import { FaAward } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import useAuth from "../Layout/useAuth";
import useAdmin from "../../hooks/useAdmin";


const SocialContact = () => {
  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  return (
    <div className="bg-[#262626] hidden md:block">
      <div className="flex justify-between max-w-screen-xl mx-auto py-2 px-3">
        <div className="flex items-center gap-4 text-white text-base">
          <p className="flex items-center gap-3">
            Have any need
            <PiSealQuestionFill className="text-[#2acb35] text-xl" />
          </p>
          <p className="flex items-center gap-3">
            <FaWhatsappSquare className="text-[#2acb35] text-xl" />
            WhatsApp: +880 1805213197
          </p>
          <p className="flex items-center gap-3">
            <MdEmail className="text-[#2acb35] text-xl" />
            Email:{" "}
            <p>
              hello@squirrelpeace.com
            </p>
          </p>
          <NavLink to="/success" className="flex items-center gap-3 link-hover hover:text-[#2acb35]">
            <FaAward className="text-[#2acb35] text-xl" />
            Success
          </NavLink>
          <NavLink to="/faq" className="flex items-center gap-3 link-hover hover:text-[#2acb35]">
            <FcFaq className="text-[#2acb35] text-xl" />
            FAQ
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
            onClick={() => window.open('https://www.facebook.com/squirrelpeace', '_blank')}
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <GrFacebookOption />
          </button>
          <button
            title="Instagram"
            onClick={() => window.open('https://www.instagram.com/squirrelpeace/', '_blank')}
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <RxInstagramLogo />
          </button>
          <button
            title="Twitter"
            onClick={() => window.open('https://x.com/squirrelpeace', '_blank')}
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <RiTwitterXLine />
          </button>
          <button
            title="Linkedin"
            onClick={() => window.open('https://www.linkedin.com/in/squirrel-peace-146019379/', '_blank')}
            className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115"
          >
            <BiLogoLinkedin />
          </button>
          <button
            title="Pinterest"
            onClick={() => window.open('https://www.pinterest.com/squirrelpeace1/', '_blank')}
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
