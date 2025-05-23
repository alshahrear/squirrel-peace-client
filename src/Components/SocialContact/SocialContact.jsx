import { BiLogoLinkedin } from "react-icons/bi";
import { GrFacebookOption } from "react-icons/gr";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { TfiPinterest } from "react-icons/tfi";
import { PiPhoneCallFill } from "react-icons/pi";
import { MdEmail } from "react-icons/md";
import { PiSealQuestionFill } from "react-icons/pi";


const SocialContact = () => {
    return (
        <div className="bg-[#262626] ">
            <div className="flex justify-between max-w-screen-xl mx-auto">
                <div className="flex items-center gap-16 px-3 text-white  font-medium text-[16px] py-2">
                    <p className="flex items-center gap-3"> Have any need <PiSealQuestionFill className="text-[#2acb35] text-xl"></PiSealQuestionFill></p>
                    <p className="flex items-center gap-3"><PiPhoneCallFill className="text-[#2acb35] text-xl"></PiPhoneCallFill>Phone: +880 1612002913</p>
                    <p className="flex items-center gap-3"> <MdEmail className="text-[#2acb35] text-xl"></MdEmail> Email: alshahrear1@gmail.com</p>
                </div>
                <div className='flex items-center space-x-5'>
                    <button title="Facebook" className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115">
                        <GrFacebookOption />
                    </button>
                    <button title="Instagram" className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115">
                        <RxInstagramLogo></RxInstagramLogo>
                    </button>
                    <button title="Twitter" className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115">
                        <RiTwitterXLine></RiTwitterXLine>
                    </button>
                    <button title="Linkedin" className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115">
                        <BiLogoLinkedin></BiLogoLinkedin>
                    </button>
                    <button title="Pinterest" className="flex justify-center items-center w-7 h-7 border-2 border-[#2acb35] p-1 rounded-full text-xl bg-white text-gray-700 transition transform hover:scale-115">
                        <TfiPinterest></TfiPinterest>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialContact;