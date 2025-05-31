import { BiSolidQuoteAltLeft } from "react-icons/bi";
import { FaStar } from "react-icons/fa6";
import { IoIosArrowDroprightCircle, IoIosArrowDropleftCircle } from "react-icons/io";

const LetterTestimonials = () => {
    return (
        <div className="py-10 relative">
            <h3 className="text-2xl font-bold mb-8">
                Parent's Says <span className="text-[#2acb35]">__</span>
            </h3>

            {/* Grid Layout with Arrows */}
            <div className="grid grid-cols-[40px_1fr_40px] items-center gap-4">
                {/* Left Arrow */}
                <button className="flex items-center justify-center text-[#2acb35] text-4xl">
                    <IoIosArrowDropleftCircle />
                </button>

                {/* Testimonials */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Testimonial 1 */}
                    <div className="bg-white rounded-lg border border-gray-300 p-6 pt-10 flex flex-col justify-between shadow min-h-[280px] relative">
                        {/* Quote Icon */}
                        <div className="absolute -top-5 left-6 bg-[#d3fbe0] text-[#2acb35] rounded-full p-2 text-lg shadow">
                            <BiSolidQuoteAltLeft />
                        </div>

                        <div>
                            <div className="flex text-yellow-400 mb-2">
                                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <p className="text-gray-700">
                                Mentor is highly knowledgeable, but I cannot talk or discuss my problems with my mentor, though there is a group. The group is hardly responsive.
                            </p>
                        </div>
                        <div className="flex items-center mt-6">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-black mr-3">
                                👤
                            </div>
                            <div>
                                <p className="font-bold">Md Sabuz Hossain</p>
                                <p className="text-sm text-gray-500">Student</p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="bg-white rounded-lg border border-gray-300 p-6 pt-10 flex flex-col justify-between shadow min-h-[280px] relative">
                        {/* Quote Icon */}
                        <div className="absolute -top-5 left-6 bg-[#d3fbe0] text-[#2acb35] rounded-full p-2 text-lg shadow">
                            <BiSolidQuoteAltLeft />
                        </div>

                        <div>
                            <div className="flex text-yellow-400 mb-2">
                                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                            </div>
                            <p className="text-gray-700">
                                I like it very much. I have confidence I can do Freelancing now.
                            </p>
                        </div>
                        <div className="flex items-center mt-6">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-black mr-3">
                                👤
                            </div>
                            <div>
                                <p className="font-bold">Rabindranath Roy</p>
                                <p className="text-sm text-gray-500">Student</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Arrow */}
                <button className="flex items-center justify-center text-[#2acb35] text-4xl">
                    <IoIosArrowDroprightCircle />
                </button>
            </div>
        </div>
    );
};

export default LetterTestimonials;
