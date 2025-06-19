import { GrFacebookOption } from "react-icons/gr";
import { RxInstagramLogo } from "react-icons/rx";
import { RiTwitterXLine } from "react-icons/ri";
import { BiLogoLinkedin } from "react-icons/bi";
import { TfiPinterest } from "react-icons/tfi";
import { IoLocationOutline } from "react-icons/io5";
import { PiPhoneCallLight } from "react-icons/pi";
import { MdOutlineMarkEmailRead } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { HiOutlineMailOpen } from "react-icons/hi";
import { FaPaperPlane } from "react-icons/fa6";
import useAuth from "../useAuth";
import useAdmin from "../../../hooks/useAdmin";

const Footer = () => {

  const {user} = useAuth();
  const [isAdmin] = useAdmin();

  return (
    <div className="bg-[#222426]">
      <footer className="footer flex flex-col md:flex-row max-w-screen-xl mx-auto text-[#878787] pt-10 pb-10 gap-10 md:gap-0 px-4 md:px-0">
        <nav className="flex-1 md:flex-[2] space-y-4 md:space-y-2">
          <h4 className="text-2xl font-semibold text-white border-b-4 border-b-[#2acb35] pb-2">
            Get in Touch
          </h4>
          <p className="w-full md:w-1/2 text-[16px] font-medium">
            <span className="text-[#2acb35] text-lg">Squirrel Peace</span> brings 3 years of interior
            designs experience right to your home or office. Our design professionals are to help you
            determine.
          </p>
          <p className="flex items-center text-[16px] font-medium gap-2">
            <IoLocationOutline className="text-2xl text-[#2acb35]" />
            <span>Address: Road 3, Uttara Dhaka, Bangladesh</span>
          </p>
          <p className="flex items-center text-[16px] font-medium gap-2">
            <PiPhoneCallLight className="text-2xl text-[#2acb35]" />
            <span>Phone: +880 1612002913</span>
          </p>
          <p className="flex items-center text-[16px] font-medium gap-2">
            <MdOutlineMarkEmailRead className="text-2xl text-[#2acb35]" />
            <span>Email: alshahrear1@gmail.com</span>
          </p>
        </nav>

        <nav className="flex-1 space-y-2">
          <h4 className="text-2xl font-semibold text-white border-b-4 border-b-[#2acb35] pb-2">
            Quick Links
          </h4>
          <p className="text-[16px]">
            <NavLink to="/about">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                About Us
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/lifeStyle">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Life Style Blog
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/travel">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Travel Blog
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/health">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Health Blog
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/newsletter">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Newsletter
              </span>
            </NavLink>
          </p>
        </nav>

        <nav className="flex-1 space-y-2">
          <h4 className="text-2xl font-semibold text-white border-b-4 border-b-[#2acb35] pb-2">
            Quick Links
          </h4>
          <p className="text-[16px]">
            <NavLink to="/story">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Story
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/faq">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                FAQ
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/success">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Testimonial
              </span>
            </NavLink>
          </p>
          <p className="text-[16px]">
            <NavLink to="/contact">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Contact Us
              </span>
            </NavLink>
          </p>
          {
            user && isAdmin && 
            <p className="text-[16px]">
            <NavLink to="/adminPages">
              -{" "}
              <span className="inline-block transition-all duration-300 hover:-translate-x-1 hover:text-[#2acb35]">
                Admin
              </span>
            </NavLink>
          </p>
          }
        </nav>

        <nav className="flex-1">
          <h4 className="text-2xl font-semibold text-white border-b-4 border-b-[#2acb35] pb-2">
            <span className="text-[#2acb35] text-3xl font-bold">N</span>ewsletter
          </h4>
          <p className="text-lg font-semibold">Subscribe Our Newsletter</p>
          <div className="join flex mt-3 max-w-full md:max-w-md">
            <label className="input bg-[#27282a] focus-within:bg-white text-w transition-colors duration-300 flex items-center rounded-l-full px-4">
              <span className="text-xl text-[#2acb35]">
                <HiOutlineMailOpen />
              </span>
              <input
                className="border-0 bg-transparent focus:outline-none text-black ml-2 flex-grow"
                type="email"
                placeholder="Enter Your Email*"
                required
              />
            </label>
            <button className="btn text-white text-lg font-medium rounded-r-full pr-5 border-0 bg-[#2acb35] hover:bg-[#3d3d3d] flex items-center gap-2">
              Join <FaPaperPlane />
            </button>
          </div>
        </nav>
      </footer>

      <footer className="footer bg-[#1c1e20] text-[#878787] text-lg font-semibold border-base-300 px-4 md:px-10 py-3">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          <div>
            <p>
              © {new Date().getFullYear()} All Rights Reserved, Powered by{" "}
              <span className="text-[#29bf33]">Squirrel Peace</span>.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10">
            <p className="link-hover text-[16px] hover:text-[#2acb35]">
              <NavLink to="/privacyPolicy">Privacy policy</NavLink>
            </p>
            <p className="link-hover text-[16px] hover:text-[#2acb35]">
              <NavLink to="/termCondition">Terms of Condition</NavLink>
            </p>
          </div>
          <div className="flex items-center space-x-5">
            <button
              title="Facebook"
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <GrFacebookOption />
            </button>
            <button
              title="Instagram"
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <RxInstagramLogo />
            </button>
            <button
              title="Twitter"
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <RiTwitterXLine />
            </button>
            <button
              title="Linkedin"
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <BiLogoLinkedin />
            </button>
            <button
              title="Pinterest"
              className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:bg-[#2acb35] transition transform hover:scale-115"
            >
              <TfiPinterest />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
